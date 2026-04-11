import './BikeSelect.css';
import IconCard from '../ui/IconCard';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import IconBikeStandard from '../../assets/bikes/standard.svg?react';
import IconBikeStandardElectric from '../../assets/bikes/standard-electric.svg?react';
import IconBikeVTT from '../../assets/bikes/vtt.svg?react';
import IconBikeVTT_Electric from '../../assets/bikes/vtt-electric.svg?react';
import IconBikeRoute from '../../assets/bikes/route.svg?react';
import { MdBatteryChargingFull } from "react-icons/md";

export default function BikeSelect({ selectedBike, onSelect }) {
    const { userBikes } = useAuth();

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

    const defaultBikes = [
        { id: "default-ville", type: "ville", electric: false, name: "Ville", icon: IconBikeStandard },
        { id: "default-ville-electric", type: "ville", electric: true, name: "Ville", icon: IconBikeStandardElectric },
        { id: "default-vtt", type: "vtt", electric: false, name: "VTT", icon: IconBikeVTT },
        { id: "default-vtt-electric", type: "vtt", electric: true, name: "VTT", icon: IconBikeVTT_Electric },
        { id: "default-route", type: "route", electric: false, name: "Route", icon: IconBikeRoute },
    ];

    let bikes = defaultBikes;

    if (userBikes && userBikes.length > 0) {

        bikes = userBikes.map(bike => {
            let icon;
            const bikeType = bike.type?.toLowerCase();
            if (bikeType === "ville") {
                icon = bike.is_electric ? IconBikeStandardElectric : IconBikeStandard;
            } else if (bikeType === "vtt") {
                icon = bike.is_electric ? IconBikeVTT_Electric : IconBikeVTT;
            } else if (bikeType === "route") {
                icon = IconBikeRoute;
            } else {
                icon = IconBikeStandard;
            }
            return { id: bike.id, type: bike.type, is_electric: bike.is_electric, name: bike.name, icon: icon };
        });
    }

    useEffect(() => {
        if (bikes.length === 1 && selectedBike !== bikes[0].id) {
            onSelect(bikes[0].id);
        }
    }, [bikes.length, selectedBike, onSelect]);

    const SingleBikeIcon = bikes.length === 1 ? bikes[0].icon : null;

    return (
        <div className="bike-select-container">
            {bikes.length > 1 && <h2>Choix du vélo</h2>}
            <div ref={listRef} onScroll={checkScroll} data-scroll={scrollState} className='bike-select'>
                {
                    bikes.length === 1 ? (
                        <div className='default-bike-info'>
                            {SingleBikeIcon && <SingleBikeIcon className='default-bike-icon' />}
                            <p><strong>{bikes[0].name}</strong> sélectionné</p>
                        </div>
                    ) : (
                        bikes.map((bike) => (
                            <IconCard
                                key={bike.id}
                                id={bike.id}
                                IconSVG={bike.icon}
                                label={bike.name}
                                LabelIcon={bike.electric ? <MdBatteryChargingFull /> : null}
                                selected={selectedBike === bike.id}
                                onClick={() => onSelect(bike.id)}
                            />
                        ))
                    )
                }
            </div>
        </div>
    );
}
