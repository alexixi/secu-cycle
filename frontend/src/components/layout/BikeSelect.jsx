import './BikeSelect.css';
import IconCard from '../ui/IconCard';
import { useRef, useState, useEffect } from 'react';
import IconBikeStandard from '../../assets/bikes/standard.svg?react';
import IconBikeStandardElectric from '../../assets/bikes/standard-electric.svg?react';
import IconBikeVTT from '../../assets/bikes/vtt.svg?react';
import IconBikeVTT_Electric from '../../assets/bikes/vtt-electric.svg?react';
import IconBikeRoute from '../../assets/bikes/route.svg?react';

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
        { id: "standard", type: "standard", electric: false, name: "Vélo standard", icon: IconBikeStandard },
        { id: "standard-electric", type: "standard", electric: true, name: "Vélo électrique", icon: IconBikeStandardElectric },
        { id: "vtt", type: "vtt", electric: false, name: "VTT", icon: IconBikeVTT },
        { id: "vtt-electric", type: "vtt", electric: true, name: "VTT électrique", icon: IconBikeVTT_Electric },
        { id: "route", type: "route", electric: false, name: "Vélo de route", icon: IconBikeRoute },
    ];

    return (
        <div className="bike-select-container">
            <h2>Choix du vélo</h2>
            <div ref={listRef} onScroll={checkScroll} data-scroll={scrollState} className='bike-select'>
                {bikes.map((bike) => (
                    <IconCard
                        key={bike.id}
                        id={bike.id}
                        IconSVG={bike.icon}
                        label={bike.name}
                        selected={selectedBike === bike.id}
                        onClick={() => onSelect(bike.id)}
                    />
                ))}
            </div>
        </div>
    );
}
