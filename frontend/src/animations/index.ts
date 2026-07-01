export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: 'easeIn' } },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
}

export const slideUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export const slideDown = {
  initial: { opacity: 0, y: -30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export const slideLeft = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
}

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export const cardHover = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
}

export const buttonTap = {
  rest: { scale: 1 },
  tap: { scale: 0.95 },
}

export const rippleEffect = {
  rest: { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
  hover: { boxShadow: '0 0 0 8px rgba(16, 185, 129, 0.15)' },
}

export const counterAnimation = (value: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } },
})

export const progressAnimation = (progress: number) => ({
  initial: { width: '0%' },
  animate: { width: `${progress}%`, transition: { duration: 1, ease: 'easeOut', delay: 0.2 } },
})

export const successAnimation = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: [0, 1.2, 1], opacity: [0, 1, 1], transition: { duration: 0.5, times: [0, 0.6, 1] } },
}

export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export const modalContent = {
  initial: { opacity: 0, scale: 0.9, y: 40 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.9, y: 40, transition: { duration: 0.2, ease: 'easeIn' } },
}
