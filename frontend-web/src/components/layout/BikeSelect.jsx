import { Trans, useTranslation } from 'react-i18next';
import './BikeSelect.css';
import IconCard from '../ui/IconCard';
import { useEffect } from 'react';
import useScrollFade from '../../hooks/useScrollFade';
import { useAuth } from "../../context/AuthContext";
import IconBikeStandard from '../../assets/bikes/standard.svg?react';
import IconBikeStandardElectric from '../../assets/bikes/standard-electric.svg?react';
import IconBikeVTT from '../../assets/bikes/vtt.svg?react';
import IconBikeVTT_Electric from '../../assets/bikes/vtt-electric.svg?react';
import IconBikeRoute from '../../assets/bikes/route.svg?react';
import { MdBatteryChargingFull } from "react-icons/md";

export default function BikeSelect({ selectedBike, onSelect }) {
    const { t } = useTranslation('itineraire');
    const { userBikes } = useAuth();

    const { ref: listRef, scrollState, checkScroll, scrollProps } = useScrollFade();

    const defaultBikes = [
        { id: "default-ville", type: "ville", electric: false, name: t('velo.ville'), icon: IconBikeStandard },
        { id: "default-ville-electric", type: "ville", electric: true, name: t('velo.ville'), icon: IconBikeStandardElectric },
        { id: "default-vtt", type: "vtt", electric: false, name: t('velo.vtt'), icon: IconBikeVTT },
        { id: "default-vtt-electric", type: "vtt", electric: true, name: t('velo.vtt'), icon: IconBikeVTT_Electric },
        { id: "default-route", type: "route", electric: false, name: t('velo.route'), icon: IconBikeRoute },
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

    useEffect(() => { checkScroll(); }, [checkScroll, bikes.length]);

    const SingleBikeIcon = bikes.length === 1 ? bikes[0].icon : null;

    return (
        <div className="bike-select-container">
            {bikes.length > 1 && <h2>{t('velo.choix')}</h2>}
            <div ref={listRef} data-scroll={scrollState} className='bike-select' {...scrollProps}>
                {
                    bikes.length === 1 ? (
                        <div className='default-bike-info'>
                            {SingleBikeIcon && <SingleBikeIcon className='default-bike-icon' />}
                            <p><Trans t={t} i18nKey="velo.selectionne" values={{ nom: bikes[0].name }} components={{ nom: <strong /> }} /></p>
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
