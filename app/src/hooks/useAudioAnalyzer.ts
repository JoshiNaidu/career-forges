import {
  useEffect,
  useRef,
  useState,
} from "react";

export default function useAudioAnalyzer(
  active: boolean
) {
  const [levels, setLevels] =
    useState<number[]>(
      new Array(24).fill(8)
    );

  const analyserRef =
    useRef<AnalyserNode | null>(
      null
    );

  const animationRef =
    useRef<number | null>(
      null
    );

  useEffect(() => {
    if (!active) {
      setLevels(
        new Array(24).fill(8)
      );

      return;
    }

    let audioContext:
      | AudioContext
      | undefined;

    let source:
      | MediaStreamAudioSourceNode
      | undefined;

    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then((stream) => {
        audioContext =
          new AudioContext();

        const analyser =
          audioContext.createAnalyser();

        analyser.fftSize = 128;

        source =
          audioContext.createMediaStreamSource(
            stream
          );

        source.connect(
          analyser
        );

        analyserRef.current =
          analyser;

        const dataArray =
          new Uint8Array(
            analyser.frequencyBinCount
          );

        const update =
          () => {
            analyser.getByteFrequencyData(
              dataArray
            );

            const nextLevels =
              Array.from({
                length: 24,
              }).map(
                (_, index) => {
                  const value =
                    dataArray[
                      index
                    ] || 0;

                  return Math.max(
                    8,
                    value /
                      2
                  );
                }
              );

            setLevels(
              nextLevels
            );

            animationRef.current =
              requestAnimationFrame(
                update
              );
          };

        update();
      });

    return () => {
      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        );
      }

      audioContext?.close();
    };
  }, [active]);

  return levels;
}