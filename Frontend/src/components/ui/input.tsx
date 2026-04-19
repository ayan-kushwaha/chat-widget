"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useMotionTemplate, useMotionValue, motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    isPassword?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, isPassword, ...props }, ref) => {
        const radius = 100;
        const [visible, setVisible] = React.useState(false);
        const [showPassword, setShowPassword] = React.useState(false);

        let mouseX = useMotionValue(0);
        let mouseY = useMotionValue(0);

        function handleMouseMove({ currentTarget, clientX, clientY }: any) {
            let { left, top } = currentTarget.getBoundingClientRect();

            mouseX.set(clientX - left);
            mouseY.set(clientY - top);
        }

        const inputType = isPassword ? (showPassword ? "text" : "password") : type;

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
                <input
                    type={inputType}
                    className={cn(
                        `flex h-10 w-full rounded-md border border-neutral-100 bg-gray-50 px-3 py-2 text-sm text-neutral-900 shadow-input transition duration-400 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-blue-900 group-hover/input:shadow-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0e0e0e] dark:border-white/5 dark:text-white dark:placeholder:text-neutral-500`,
                        isPassword && "pr-10",
                        className,
                    )}
                    ref={ref}
                    autoComplete="off"
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 transition-colors hover:text-neutral-900 focus:outline-none dark:text-neutral-400 dark:hover:text-white"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {showPassword ? (
                                <motion.div
                                    key="eye-off"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    transition={{ duration: 0.3, type: "spring" }}
                                >
                                    <EyeOff className="h-4 w-4" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="eye"
                                    initial={{ scale: 0, rotate: 180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: -180 }}
                                    transition={{ duration: 0.3, type: "spring" }}
                                >
                                    <Eye className="h-4 w-4" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                )}
            </motion.div>
        );
    },
);
Input.displayName = "Input";

export { Input };
