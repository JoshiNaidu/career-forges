import { motion } from "framer-motion";

import useAudioAnalyzer from "../../hooks/useAudioAnalyzer";

type Props = {
  active: boolean;
  energy: number;
};

export default function SpeakingWave({
  active,
  energy,
}: Props) {
  const levels =
    useAudioAnalyzer(
      active
    );

  return (
    <div className="mt-4 flex h-14 items-end justify-center gap-1">

      {levels.map(
        (
          height,
          index
        ) => (
          <motion.div
            key={index}
            animate={{
              height,
              opacity:
                active
                  ? 1
                  : 0.15,
            }}
            transition={{
              duration: 0.12,
            }}
            className="w-[4px] rounded-full bg-gradient-to-t from-orange-600 via-orange-400 to-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
          />
        )
      )}

    </div>
  );
}