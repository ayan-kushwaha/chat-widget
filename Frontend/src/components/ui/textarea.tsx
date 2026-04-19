import * as React from "react"
import { useMotionTemplate, useMotionValue, motion } from "framer-motion";

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  const radius = 100;
  const [visible, setVisible] = React.useState(false);
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: any) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      style={{
        background: useMotionTemplate`
        radial-gradient(
          ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
          #3b82f6,
          transparent 80%
        )
      `,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className="group/input relative rounded-lg p-[2px] transition duration-300"
    >
      <textarea
        className={cn(
          `flex min-h-80 w-full rounded-md border border-neutral-100 bg-gray-50 px-3 py-2 text-sm text-neutral-900 shadow-input transition duration-400 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-blue-900 group-hover/input:shadow-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0e0e0e] dark:border-white/5 dark:text-white dark:placeholder:text-neutral-500`,

          className
        )}
        ref={ref}
        {...props}
      />
    </motion.div>
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
