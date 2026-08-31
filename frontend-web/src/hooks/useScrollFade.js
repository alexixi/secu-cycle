import { useCallback, useEffect, useRef, useState } from 'react';

const SEUIL_GLISSE = 5;

export default function useScrollFade() {
    const ref = useRef(null);
    const [scrollState, setScrollState] = useState('none');
    const glisse = useRef(null);

    const checkScroll = useCallback(() => {
        const el = ref.current;
        if (!el) return;

        const { scrollLeft, scrollWidth, clientWidth } = el;

        if (scrollWidth - clientWidth <= 1) {
            setScrollState('none');
        } else if (scrollLeft <= 0) {
            setScrollState('start');
        } else if (Math.abs(scrollWidth - clientWidth - scrollLeft) <= 1) {
            setScrollState('end');
        } else {
            setScrollState('middle');
        }
    }, []);

    useEffect(() => {
        checkScroll();

        const el = ref.current;
        const observateur = new ResizeObserver(checkScroll);
        if (el) observateur.observe(el);

        window.addEventListener('resize', checkScroll);
        return () => {
            observateur.disconnect();
            window.removeEventListener('resize', checkScroll);
        };
    }, [checkScroll]);

    const onPointerDown = (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        const el = ref.current;
        if (!el || el.scrollWidth - el.clientWidth <= 1) return;

        glisse.current = { x: e.clientX, depart: el.scrollLeft, aBouge: false };
        el.setPointerCapture(e.pointerId);
        el.classList.add('is-dragging');
    };

    const onPointerMove = (e) => {
        const el = ref.current;
        if (!glisse.current || !el) return;

        const dx = e.clientX - glisse.current.x;
        if (Math.abs(dx) > SEUIL_GLISSE) glisse.current.aBouge = true;
        el.scrollLeft = glisse.current.depart - dx;
    };

    const finGlisse = (e) => {
        const el = ref.current;
        if (!glisse.current || !el) return;

        el.releasePointerCapture?.(e.pointerId);
        el.classList.remove('is-dragging');
        glisse.current = glisse.current.aBouge ? { aBouge: true } : null;
    };

    const onClickCapture = (e) => {
        if (!glisse.current?.aBouge) return;
        e.stopPropagation();
        glisse.current = null;
    };

    return {
        ref,
        scrollState,
        checkScroll,
        scrollProps: {
            onScroll: checkScroll,
            onPointerDown,
            onPointerMove,
            onPointerUp: finGlisse,
            onPointerCancel: finGlisse,
            onClickCapture,
        },
    };
}
