import { motion } from "framer-motion";

type Props = {
  speaking: boolean;
  listening: boolean;
  energy: number;
};

export default function AIOrb({
  speaking,
  listening,
  energy,
}: Props) {
  return (
    <div className="relative flex items-center justify-center">

      {/* OUTER GLOW */}
      <motion.div
        animate={{
          scale: speaking
            ? [1, 1.18, 1]
            : [1, 1.04, 1],

          opacity: speaking
            ? [0.2, 0.5, 0.2]
            : [0.1, 0.2, 0.1],
        }}
        transition={{
          repeat: Infinity,
          duration: speaking
            ? 1.2
            : 3,
        }}
        className="absolute h-40 w-40 rounded-full bg-orange-500 blur-3xl"
      />

      {/* MIDDLE RING */}
      <motion.div
        animate={{
          scale: listening
            ? [1, 1.08, 1]
            : 1,
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
        }}
        className="absolute h-32 w-32 rounded-full border border-orange-400/20"
      />

      {/* MAIN ORB */}
      <motion.div
        animate={{
          scale: speaking
            ? [1, 1.04, 1]
            : [1, 1.01, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
        }}
        className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_0_50px_rgba(249,115,22,0.4)]"
      >

        <div className="h-7 w-7 rounded-full bg-white/30 backdrop-blur-xl" />

      </motion.div>

    </div>
  );
}