import { useCallback, useEffect, useRef, useState } from "react";
import { MdDirectionsBike } from "react-icons/md";
import { IoMdPin } from "react-icons/io";
import "./FaqRoute.css";

const MOBILE_QUERY = "(max-width: 800px)";

function pointsToSmoothPath(points) {
    if (points.length < 2) return "";
    const d = [`M ${points[0].x} ${points[0].y}`];
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`);
    }
    return d.join(" ");
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export default function FaqRoute({ sectionRef }) {
    const [enabled, setEnabled] = useState(
        () => typeof window !== "undefined" && !window.matchMedia(MOBILE_QUERY).matches
    );
    const [dims, setDims] = useState({ w: 0, h: 0 });
    const [path, setPath] = useState("");
    const [endpoints, setEndpoints] = useState({ start: null, end: null });

    const pathRef = useRef(null);
    const bikeRef = useRef(null);
    const rafRef = useRef(0);

    useEffect(() => {
        const mql = window.matchMedia(MOBILE_QUERY);
        const onChange = () => setEnabled(!mql.matches);
        onChange();
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    const measure = useCallback(() => {
        const section = sectionRef.current;
        if (!section) return;
        const w = section.offsetWidth;
        const h = section.offsetHeight;
        const cards = Array.from(section.querySelectorAll(".home-section"));
        if (cards.length === 0) return;

        const centers = cards.map((card) => ({
            x: card.offsetLeft + card.offsetWidth / 2,
            y: card.offsetTop + card.offsetHeight / 2,
        }));

        const first = centers[0];
        const last = centers[centers.length - 1];
        const start = { x: first.x, y: clamp(first.y - 250, 0, h) };
        const end = { x: last.x, y: clamp(last.y + 300, 30, h + 30) };
        const points = [start, ...centers, end];

        setDims({ w, h });
        setPath(pointsToSmoothPath(points));
        setEndpoints({ start, end });
    }, [sectionRef]);

    useEffect(() => {
        if (!enabled) return;
        const section = sectionRef.current;
        if (!section) return;

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(section);
        window.addEventListener("resize", measure);
        window.addEventListener("load", measure);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", measure);
            window.removeEventListener("load", measure);
        };
    }, [enabled, measure, sectionRef]);

    useEffect(() => {
        if (!enabled) return;

        const update = () => {
            rafRef.current = 0;
            const section = sectionRef.current;
            const pathEl = pathRef.current;
            const bike = bikeRef.current;
            if (!section || !pathEl || !bike) return;

            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + window.scrollY;
            const sectionHeight = rect.height || 1;
            const progress = clamp(
                (window.scrollY + window.innerHeight / 2 - sectionTop) / sectionHeight,
                0,
                1
            );

            const total = pathEl.getTotalLength();
            const len = total * progress;
            const p = pathEl.getPointAtLength(len);
            const ahead = pathEl.getPointAtLength(Math.min(total, len + 1));
            const behind = pathEl.getPointAtLength(Math.max(0, len - 1));
            const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;

            bike.style.transform =
                `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${angle}deg)`;
            bike.style.opacity = progress <= 0.02 || progress >= 0.98 ? "0" : "1";

            if (pathEl.dataset.role === "track") {
                pathEl.style.strokeDasharray = `${total}`;
                pathEl.style.strokeDashoffset = `${total - len}`;
            }
        };

        const onScroll = () => {
            if (rafRef.current) return;
            rafRef.current = requestAnimationFrame(update);
        };

        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [enabled, path, sectionRef]);

    if (!enabled || !path || dims.w === 0) return null;

    return (
        <>
            <svg
                className="faq-route-svg"
                width={dims.w}
                height={dims.h}
                viewBox={`0 0 ${dims.w} ${dims.h}`}
                fill="none"
                aria-hidden="true"
            >
                <path className="faq-route-line" d={path} />
                <path className="faq-route-progress" data-role="track" d={path} ref={pathRef} />
            </svg>
            {endpoints.start && (
                <div
                    className="faq-route-pin"
                    style={{ transform: `translate(${endpoints.start.x}px, ${endpoints.start.y}px) translate(-50%, -100%)` }}
                    aria-hidden="true"
                >
                    <IoMdPin size={36} color="#3d46f6" />
                </div>
            )}
            {endpoints.end && (
                <div
                    className="faq-route-pin"
                    style={{ transform: `translate(${endpoints.end.x}px, ${endpoints.end.y}px) translate(-50%, -100%)` }}
                    aria-hidden="true"
                >
                    <IoMdPin size={36} color="#e63946" />
                </div>
            )}
            <div className="faq-route-bike" ref={bikeRef} aria-hidden="true">
                <MdDirectionsBike size={32} />
            </div>
        </>
    );
}
