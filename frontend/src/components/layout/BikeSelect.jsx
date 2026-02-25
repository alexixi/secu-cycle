import './BikeSelect.css';
import IconCard from '../ui/IconCard';
import { useRef, useState, useEffect } from 'react';

export default function BikeSelect({ selectedBike, onSelect }) {

    const listRef = useRef(null);
    const [scrollState, setScrollState] = useState('start');

    const checkScroll = () => {
        const el = listRef.current;
        if (!el) return;

        const { scrollLeft, scrollWidth, clientWidth } = el;

        const isStart = scrollLeft <= 0;
        const isEnd = Math.abs(scrollWidth - clientWidth - scrollLeft) <= 1;

        if (scrollWidth === clientWidth) {
            setScrollState('none');
        } else if (isStart) {
            setScrollState('start');
        } else if (isEnd) {
            setScrollState('end');
        } else {
            setScrollState('middle');
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, []);

    const bikes = [
        { id: "standard", type: "standard", electric: false, name: "Vélo standard" },
        { id: "standard-electric", type: "standard", electric: true, name: "Vélo électrique" },
        { id: "vtt", type: "vtt", electric: false, name: "VTT" },
        { id: "vtt-electric", type: "vtt", electric: true, name: "VTT électrique" },
        { id: "route", type: "route", electric: false, name: "Vélo de route" },
    ];

    return (
        <div className="bike-select-container">
            <h2>Choix du vélo</h2>
            <div ref={listRef} onScroll={checkScroll} data-scroll={scrollState} className='bike-select'>
                {bikes.map((bike) => (
                    <IconCard
                        key={bike.id}
                        iconPath={`/bikes/${bike.id}.png`}
                        label={bike.name}
                        selected={selectedBike === bike.id}
                        onClick={() => onSelect(bike.id)}
                    />
                ))}
            </div>
        </div>
    );
}
