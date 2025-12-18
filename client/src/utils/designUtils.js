import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

// Register GSAP plugins if needed (e.g., ScrollTrigger)
// gsap.registerPlugin(ScrollTrigger); 

/**
 * Standard Fade In Animation
 * Used for entering elements
 */
export const fadeIn = (element, delay = 0, duration = 0.5) => {
    if (!element) return;
    gsap.fromTo(element,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: duration, delay: delay, ease: "power2.out" }
    );
};

/**
 * Staggered List Animation
 * Used for lists of items like amenities or metrics
 */
export const staggerList = (elements, delay = 0, stagger = 0.1) => {
    if (!elements || elements.length === 0) return;
    gsap.fromTo(elements,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, delay: delay, stagger: stagger, ease: "back.out(1.7)" }
    );
};

/**
 * Scale Up Hover Effect
 * Used for interactive cards
 */
export const hoverScale = (element) => {
    if (!element) return;
    const tl = gsap.timeline({ paused: true });
    tl.to(element, { scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", duration: 0.2 });

    element.addEventListener('mouseenter', () => tl.play());
    element.addEventListener('mouseleave', () => tl.reverse());

    return () => { // Cleanup
        element.removeEventListener('mouseenter', () => tl.play());
        element.removeEventListener('mouseleave', () => tl.reverse());
    };
};

/**
 * Number Counter Animation
 * Used for scores or metrics
 */
export const animateCounter = (obj, targetValue, duration = 1) => {
    gsap.to(obj, { value: targetValue, duration: duration, roundProps: "value", ease: "power1.inOut" });
};
