import { useCallback, useEffect, useRef, useState } from "react";

/** Default BCP-47 language — change here to support other locales later. */
export const SPEECH_LANG = "en-US";

/** Auto-stop after this many ms without new speech results. */
export const SPEECH_SILENCE_MS = 3000;

function getSpeechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function friendlyError(code) {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was blocked. Allow mic permission in your browser settings and try again.";
    case "no-speech":
      return "No speech detected. Try speaking closer to your microphone.";
    case "audio-capture":
      return "No microphone found. Connect a mic and try again.";
    case "network":
      return "The browser speech service could not be reached. Check your internet/VPN, or use a current Chrome version for on-device voice input.";
    default:
      return "Voice input failed. Please try again.";
  }
}

/**
 * Prefer the newer on-device Web Speech API when it is available. Older
 * browsers simply return false and continue with their hosted speech service.
 */
async function prepareOnDeviceRecognition(SpeechRecognition, lang) {
  if (
    typeof SpeechRecognition.available !== "function" ||
    typeof SpeechRecognition.install !== "function"
  ) {
    return false;
  }

  try {
    let availability = await SpeechRecognition.available({
      langs: [lang],
      processLocally: true,
    });

    if (availability === "downloadable") {
      const installed = await SpeechRecognition.install({ langs: [lang] });
      if (!installed) return false;
      availability = await SpeechRecognition.available({
        langs: [lang],
        processLocally: true,
      });
    }

    return availability === "available";
  } catch {
    // This experimental API differs across browser releases. Falling back to
    // regular Web Speech is safer than disabling voice input entirely.
    return false;
  }
}

/**
 * Browser-native speech-to-text via the Web Speech API.
 *
 * @param {object} opts
 * @param {string}   opts.lang              BCP-47 tag (default SPEECH_LANG)
 * @param {boolean}  opts.continuous        Keep listening across pauses
 * @param {number}   opts.silenceMs         Auto-stop after N ms of silence
 * @param {function(string): void} opts.onTranscriptUpdate  Live text for the input
 * @param {function(string): void} [opts.onComplete]        Called when listening ends
 * @param {function(string): void} [opts.onError]            User-facing error message
 */
export function useSpeechToText({
  lang = SPEECH_LANG,
  continuous = true,
  silenceMs = SPEECH_SILENCE_MS,
  onTranscriptUpdate,
  onComplete,
  onError,
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const baseTextRef = useRef("");
  const accumulatedRef = useRef("");
  const isListeningRef = useRef(false);
  const isStartingRef = useRef(false);

  const onTranscriptUpdateRef = useRef(onTranscriptUpdate);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptUpdateRef.current = onTranscriptUpdate;
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onTranscriptUpdate, onComplete, onError]);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognitionCtor());
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const publishTranscript = useCallback((interim = "") => {
    const text = baseTextRef.current + accumulatedRef.current + interim;
    onTranscriptUpdateRef.current?.(text);
    return text;
  }, []);

  const finalize = useCallback(() => {
    if (!isListeningRef.current) return "";
    isListeningRef.current = false;
    const text = publishTranscript("");
    onCompleteRef.current?.(text);
    return text;
  }, [publishTranscript]);

  const stop = useCallback(() => {
    clearSilenceTimer();
    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognitionRef.current = null;
    setIsListening(false);

    try {
      recognition.stop();
    } catch {
      try {
        recognition.abort();
      } catch {
        // already stopped
      }
    }
  }, [clearSilenceTimer]);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    if (silenceMs > 0) {
      silenceTimerRef.current = setTimeout(() => {
        stop();
      }, silenceMs);
    }
  }, [clearSilenceTimer, silenceMs, stop]);

  const start = useCallback(
    async (baseText = "") => {
      const SpeechRecognition = getSpeechRecognitionCtor();
      if (!SpeechRecognition || isStartingRef.current) return;
      isStartingRef.current = true;

      // Stop any prior session before starting a new one.
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }

      baseTextRef.current = baseText;
      accumulatedRef.current = "";
      setError(null);

      try {
        const useOnDevice = await prepareOnDeviceRecognition(
          SpeechRecognition,
          lang
        );
        const recognition = new SpeechRecognition();
        recognition.continuous = continuous;
        recognition.interimResults = true;
        recognition.lang = lang;
        recognition.maxAlternatives = 1;
        if (useOnDevice && "processLocally" in recognition) {
          recognition.processLocally = true;
        }

        recognition.onresult = (event) => {
          let interim = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;

            if (result.isFinal) {
              accumulatedRef.current += transcript;
            } else {
              interim += transcript;
            }
          }

          publishTranscript(interim);
          resetSilenceTimer();
        };

        recognition.onerror = (event) => {
          if (event.error === "aborted") return;

          const message = friendlyError(event.error);
          setError(message);
          onErrorRef.current?.(message);
          isListeningRef.current = false;
          setIsListening(false);
          clearSilenceTimer();
        };

        recognition.onend = () => {
          clearSilenceTimer();
          recognitionRef.current = null;
          setIsListening(false);
          finalize();
        };

        recognitionRef.current = recognition;
        isListeningRef.current = true;
        recognition.start();
        setIsListening(true);
        resetSilenceTimer();
      } catch {
        const message = "Failed to start speech recognition.";
        setError(message);
        onErrorRef.current?.(message);
        isListeningRef.current = false;
        setIsListening(false);
      } finally {
        isStartingRef.current = false;
      }
    },
    [
      continuous,
      lang,
      clearSilenceTimer,
      finalize,
      publishTranscript,
      resetSilenceTimer,
    ]
  );

  const toggle = useCallback(
    (baseText = "") => {
      if (isListeningRef.current) {
        stop();
      } else {
        start(baseText);
      }
    },
    [start, stop]
  );

  const clearError = useCallback(() => setError(null), []);

  // Tear down on unmount.
  useEffect(
    () => () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    },
    [clearSilenceTimer]
  );

  return {
    isListening,
    isSupported,
    error,
    start,
    stop,
    toggle,
    clearError,
  };
}
