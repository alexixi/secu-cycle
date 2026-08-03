import "./ProfilePage.css"

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { changeProfileInfo, changeAddress, addBike, editBike, suppressBike, getUserBikes, getUserHistoric, deleteHistoricEntry, deleteAllHistoric, getBadges } from "../services/apiBack";
import { trackEvent } from "../services/analytics";

import Meta from "../components/Meta";
import IconButton from "../components/ui/IconButton";
import IconCard from '../components/ui/IconCard';

import EditAddressModal from "../components/layout/modals/EditAddressModal";
import EditProfileModal from "../components/layout/modals/EditProfileModal";
import SuppressBikeModal from "../components/layout/modals/SuppressBikeModal";
import AddBikeModal from "../components/layout/modals/AddBikeModal"
import EditBikeModal from "../components/layout/modals/EditBikeModal"
import HistoricModal from "../components/layout/modals/HistoricModal";

// Icons
import { PiPathBold } from "react-icons/pi";
import { MdOutlineTimer, MdDirectionsBike, MdStraighten, MdOutlineRoute, MdOutlineWaterDrop } from "react-icons/md";
import { MdOutlineSpeed, MdHealthAndSafety } from "react-icons/md";
import { FaFlagCheckered, FaStar, FaBalanceScale } from "react-icons/fa";
import { MdOutlineWork, MdEditLocationAlt } from "react-icons/md";
import { MdBatteryChargingFull, MdDelete } from "react-icons/md";

// Bike icons
import IconBikeStandard from '../assets/bikes/standard.svg?react';
import IconBikeStandardElectric from '../assets/bikes/standard-electric.svg?react';
import IconBikeVTT from '../assets/bikes/vtt.svg?react';
import IconBikeVTT_Electric from '../assets/bikes/vtt-electric.svg?react';
import IconBikeRoute from '../assets/bikes/route.svg?react';
import { AiFillPlusCircle } from "react-icons/ai";
import { FaHome, FaUserEdit, FaMedal } from "react-icons/fa";

const BADGE_ICONS = {
  first_route: MdDirectionsBike,
  routes_10: FaStar,
  safe_routes_10: MdHealthAndSafety,
  distance_50: MdOutlineRoute,
  distance_200: MdStraighten,
  rain_rider: MdOutlineWaterDrop,
};

const formatProgress = (value, criteria) =>
  criteria === "total_distance_km" ? Number(value).toFixed(1) : Math.round(value);

export default function ProfilePage() {
  const { user, updateUser, token, userBikes, updateBikes, historic, updateHistoric } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenInfo, setIsModalOpenInfo] = useState(false);
  const [isModalOpenAddress, setIsModalOpenAddress] = useState(false);
  const [isModalOpenSuppress, setIsModalOpenSuppress] = useState(false);
  const [isModalOpenEditBike, setIsModalOpenEditBike] = useState(false);
  const [isModalOpenHistoric, setIsModalOpenHistoric] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedBike, setSelectedBike] = useState(null);
  const [selectedHistoricEntry, setSelectedHistoricEntry] = useState(null);
  const [confirmDeleteHistoric, setConfirmDeleteHistoric] = useState(false);
  const [addressFocusField, setAddressFocusField] = useState("home");

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [birthDate, setBirthdate] = useState(user?.birth_date || "");
  const [level, setLevel] = useState(user?.sport_level || "");
  const [homeAddress, setHomeAddress] = useState(user?.home_address || "");
  const [workAddress, setWorkAddress] = useState(user?.work_address || "");
  const [bikes, setBikes] = useState(userBikes || []);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setBirthdate(user.birth_date || "");
      setLevel(user.sport_level || "");
      setHomeAddress(user.home_address || "");
      setWorkAddress(user.work_address || "");
      setBikes(userBikes || []);
    }
  }, [user, userBikes]);

  useEffect(() => {
    if (token) {
      getBadges(token).then(setBadges).catch(console.error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      getUserHistoric(token).then(updateHistoric).catch(console.error);
    }
  }, [token]);

  const handleBike = (bike, index) => {
    const isElec = bike.is_electric === true;
    const type = bike.type?.toLowerCase();
    const nameLabel = bike.name || (type === "vtt" ? "VTT" : type === "route" ? "Route" : "Ville");

    if (type === "vtt") {
      return (
        <IconCard
          key={index}
          context={nameLabel}
          IconSVG={isElec ? IconBikeVTT_Electric : IconBikeVTT}
          label={nameLabel}
          LabelIcon={isElec ? <MdBatteryChargingFull /> : null}
          onClick={() => handleEditClick(bike)}
        />
      );
    }

    if (type === "route") {
      return (
        <IconCard
          key={index}
          context={nameLabel}
          IconSVG={IconBikeRoute}
          label={nameLabel}
          LabelIcon={isElec ? <MdBatteryChargingFull /> : null}
          onClick={() => handleEditClick(bike)}
        />
      );
    }

    return (
      <IconCard
        key={index}
        context={nameLabel}
        IconSVG={isElec ? IconBikeStandardElectric : IconBikeStandard}
        label={nameLabel}
        LabelIcon={isElec ? <MdBatteryChargingFull /> : null}
        onClick={() => handleEditClick(bike)}
      />
    );
  };

  const handleSubmitAddBike = async (newBike) => {
    try {
      await addBike(token, newBike.name, newBike.type, newBike.isElectric);
      trackEvent("bike_added", { type: newBike.type, electric: newBike.isElectric });
      const response_bikes = await getUserBikes(token);
      updateBikes(response_bikes);
      setIsModalOpen(false);
      setHasError(false);
    } catch (error) {
      setHasError(true);
    }
  };

  const handleSubmitInfo = async (updatedData) => {
    try {
      const updated = await changeProfileInfo(
        token,
        updatedData.firstName,
        updatedData.lastName,
        null,
        updatedData.birthDate,
        updatedData.level
      );

      updateUser({ ...user, ...updated });

      setIsModalOpenInfo(false);
      setHasError(false);
    } catch (error) {
      setHasError(true);
    }
  };

  const handleSubmitAddress = async (updatedHomeAddress, updatedWorkAddress) => {
    try {
      await changeAddress(token, updatedHomeAddress, updatedWorkAddress);
      updateUser({
        ...user,
        home_address: updatedHomeAddress,
        work_address: updatedWorkAddress
      });
      setIsModalOpenAddress(false);
    } catch (error) {
      console.error("Error updating addresses:", error);
      setHasError(true);
    }
  };

  const handleSuppressBike = async (indexesToDelete) => {
    const bikesToProcess = indexesToDelete.map(i => bikes[i]);

    try {
      for (const bike of bikesToProcess) {
        await suppressBike(token, bike);
      }
      const response_bikes = await getUserBikes(token);
      updateBikes(response_bikes);
      setBikes(response_bikes);
      setIsModalOpenSuppress(false);
      setHasError(false);
    } catch (error) {
      setHasError(true);
    }
  };

  const handleSubmitEditBike = async (updatedBike) => {
    try {
      await editBike(token, updatedBike.id, updatedBike.name, updatedBike.type, updatedBike.is_electric);
      const response_bikes = await getUserBikes(token);
      updateBikes(response_bikes);
      setBikes(response_bikes);
      setIsModalOpenEditBike(false);
      setHasError(false);
    } catch (error) {
      setHasError(true);
    }
  };

  const handleDeleteAllHistoric = async () => {
    if (!confirmDeleteHistoric) {
      setConfirmDeleteHistoric(true);
      return;
    }
    try {
      await deleteAllHistoric(token);
      updateHistoric([]);
      setConfirmDeleteHistoric(false);
    } catch (error) {
      console.error("Erreur suppression historique:", error);
      setConfirmDeleteHistoric(false);
    }
  };

  const handleDeleteHistoricEntry = async (entryId) => {
    try {
      await deleteHistoricEntry(token, entryId);
      updateHistoric(historic.filter(e => e.id !== entryId));
      setIsModalOpenHistoric(false);
      setSelectedHistoricEntry(null);
    } catch (error) {
      console.error("Erreur suppression historique:", error);
    }
  };

  const handleEditClick = (bike) => {
    setSelectedBike(bike);
    setHasError(false);
    setIsModalOpenEditBike(true);
  };

  const handleDeleteSingleBike = async (bike) => {
    try {
      await suppressBike(token, bike);
      const response_bikes = await getUserBikes(token);
      updateBikes(response_bikes);
      setBikes(response_bikes);
      setIsModalOpenEditBike(false);
      setHasError(false);
    } catch (error) {
      setHasError(true);
    }
  };

  return (
    <>
      <Meta title="Mon Profil | Sécu'Cycle" description="Gérez vos informations personnelles, vos adresses, vos vélos et votre historique de navigation." />
      <div className="profile-page">

        <div className="title">
          {firstName || lastName ? (
            <h1>{firstName} {lastName}</h1>
          ) : (
            <h1>Mon Profil</h1>
          )}
          <IconButton className="button-modification" onClick={() => setIsModalOpenInfo(true)}>Modifier mon compte < FaUserEdit size={30} /></IconButton>
        </div>

        <div className="content">

          <div className="profile-section">
            <div className="section-title">
              <h2>Mes adresses</h2>
              <IconButton className="button-address" onClick={() => setIsModalOpenAddress(true)}>
                {
                  (homeAddress && homeAddress !== "" && workAddress && workAddress !== "")
                    ? "Modifier mes adresses" : "Ajouter mes adresses"
                } <MdEditLocationAlt size={20} />
              </IconButton>
            </div>
            <div className="address-section">
              <div
                className="address-card"
                role="button"
                tabIndex={0}
                onClick={() => { setAddressFocusField("home"); setIsModalOpenAddress(true); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAddressFocusField("home"); setIsModalOpenAddress(true); } }}
              >
                <span className="address-card-icon address-home"><FaHome size={20} /></span>
                <div className="address-card-text">
                  <span className="address-card-label">Domicile</span>
                  <span className={`address-card-value${homeAddress ? "" : " address-empty"}`}>
                    {homeAddress || "Aucune adresse renseignée"}
                  </span>
                </div>
                <MdEditLocationAlt className="address-card-edit" size={18} />
              </div>
              <div
                className="address-card"
                role="button"
                tabIndex={0}
                onClick={() => { setAddressFocusField("work"); setIsModalOpenAddress(true); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAddressFocusField("work"); setIsModalOpenAddress(true); } }}
              >
                <span className="address-card-icon address-work"><MdOutlineWork size={20} /></span>
                <div className="address-card-text">
                  <span className="address-card-label">Travail</span>
                  <span className={`address-card-value${workAddress ? "" : " address-empty"}`}>
                    {workAddress || "Aucune adresse renseignée"}
                  </span>
                </div>
                <MdEditLocationAlt className="address-card-edit" size={18} />
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="section-title">
              <h2>Mes vélos</h2>
              {bikes.length > 0 && (
                <IconButton className="button-suppress-bike" onClick={() => setIsModalOpenSuppress(true)}>
                  Supprimer un vélo <MdDelete size={20} />
                </IconButton>
              )}
            </div>

            <div className="bike-section">
              {bikes.map((bike, index) => (handleBike(bike, index)))}
              <IconButton onClick={() => setIsModalOpen(true)}><AiFillPlusCircle size={40} /></IconButton>
            </div>
          </div>

          <div className="profile-section">
            <div className="section-title">
              <h2>Historique</h2>
              {historic.length > 0 && (
                confirmDeleteHistoric ? (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9em", color: "var(--text-secondary)" }}>Confirmer ?</span>
                    <IconButton className="button-suppress-bike" onClick={handleDeleteAllHistoric}>
                      Oui <MdDelete size={16} />
                    </IconButton>
                    <IconButton className="button-address" onClick={() => setConfirmDeleteHistoric(false)}>
                      Non
                    </IconButton>
                  </div>
                ) : (
                  <IconButton className="button-suppress-bike" onClick={handleDeleteAllHistoric}>
                    Supprimer l'historique <MdDelete size={20} />
                  </IconButton>
                )
              )}
            </div>
            <div className="historic">
              {historic.length === 0 ? (
                <p>Aucun trajet enregistré pour le moment.</p>
              ) : (
                <div className="historic-list">
                  {historic.map((entry, index) => (
                    <div className="historic-entry" key={index} onClick={() => {
                      setSelectedHistoricEntry(entry);
                      setIsModalOpenHistoric(true);
                    }}>
                      <div className="historic-address">
                        <h3><MdDirectionsBike size={24} /> {entry.route?.start_address}</h3>
                        <h3><FaFlagCheckered size={24} /> {entry.route?.end_address}</h3>
                      </div>
                      <div className="path-info">
                        <span><PiPathBold /> {entry.route.distance_km.toFixed(2)} km</span>
                        <span><MdOutlineTimer /> {Math.round(entry.route.duration_min)} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h2>Statistiques</h2>
            <div className="statistic">
              {(() => {
                // Seuls les trajets réellement parcourus comptent : une recherche persiste
                // 2 à 3 variantes (rapide / sécurisé / compromis) dont une seule est complétée.
                const trajets = historic.filter(e => e.route && e.route.completed_at);
                const totalTrajets = trajets.length;
                const totalDist = trajets.reduce((s, e) => s + (e.route.distance_km || 0), 0);
                const totalTime = trajets.reduce((s, e) => s + (e.route.duration_min || 0), 0);
                const avgDist = totalTrajets > 0 ? totalDist / totalTrajets : 0;
                const typeCount = trajets.reduce((acc, e) => {
                  const t = e.route.route_type;
                  acc[t] = (acc[t] || 0) + 1;
                  return acc;
                }, {});
                const typeLabels = { fast: "Rapide", safe: "Sécurisé", compromise: "Compromis" };
                const typeIcons = { fast: MdOutlineSpeed, safe: MdHealthAndSafety, compromise: FaBalanceScale };
                const prefType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
                const PrefTypeIcon = prefType ? (typeIcons[prefType[0]] || FaStar) : FaStar;

                if (totalTrajets === 0) return <p style={{ paddingLeft: "3%", color: "var(--text-secondary)" }}>Aucun trajet enregistré pour le moment.</p>;

                return (
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="stat-card-icon"><MdDirectionsBike size={24} /></span>
                      <span className="stat-value">{totalTrajets}</span>
                      <span className="stat-label">Trajets terminés</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-card-icon"><MdOutlineRoute size={24} /></span>
                      <span className="stat-value">{totalDist.toFixed(1)} km</span>
                      <span className="stat-label">Distance totale</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-card-icon"><MdOutlineTimer size={24} /></span>
                      <span className="stat-value">
                        {Math.floor(totalTime / 60) > 0 ? `${Math.floor(totalTime / 60)}h ` : ""}{Math.round(totalTime % 60)}min
                      </span>
                      <span className="stat-label">Temps total</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-card-icon"><MdStraighten size={24} /></span>
                      <span className="stat-value">{avgDist.toFixed(1)} km</span>
                      <span className="stat-label">Distance moyenne</span>
                    </div>
                    {prefType && (
                      <div className="stat-card">
                        <span className="stat-card-icon"><PrefTypeIcon size={24} /></span>
                        <span className="stat-value">{typeLabels[prefType[0]] || prefType[0]}</span>
                        <span className="stat-label">Type préféré</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="profile-section">
            <h2>Mes badges</h2>
            <div className="statistic">
              {badges.length === 0 ? (
                <p style={{ paddingLeft: "3%", color: "var(--text-secondary)" }}>Aucun badge disponible.</p>
              ) : (
                <div className="badges-grid">
                  {badges.map((badge) => {
                    const BadgeIcon = BADGE_ICONS[badge.code] || FaMedal;
                    const unlocked = !!badge.obtained_at;
                    return (
                      <div
                        key={badge.id}
                        className={`stat-card${unlocked ? "" : " badge-locked"}`}
                        title={badge.description}
                      >
                        <span className="stat-card-icon"><BadgeIcon size={24} /></span>
                        <span className="stat-value badge-name">{badge.name}</span>
                        <span className="stat-label">
                          {unlocked
                            ? "Débloqué"
                            : `${formatProgress(badge.progress, badge.criteria)}/${badge.goal_value}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <EditProfileModal
        isOpen={isModalOpenInfo}
        hasError={hasError}
        onClose={() => setIsModalOpenInfo(false) || setHasError(false)}
        onConfirm={handleSubmitInfo}
        userData={{ firstName, lastName, email, birthDate, level }}
      />

      <EditAddressModal
        isOpen={isModalOpenAddress}
        hasError={hasError}
        focusField={addressFocusField}
        onClose={() => setIsModalOpenAddress(false) || setHasError(false)}
        onConfirm={handleSubmitAddress}
      />

      <AddBikeModal
        isOpen={isModalOpen}
        hasError={hasError}
        onClose={() => setIsModalOpen(false) || setHasError(false)}
        onConfirm={handleSubmitAddBike}
      />

      <SuppressBikeModal
        isOpen={isModalOpenSuppress}
        hasError={hasError}
        onClose={() => setIsModalOpenSuppress(false) || setHasError(false)}
        bikes={bikes}
        onConfirm={handleSuppressBike}
      />

      <EditBikeModal
        isOpen={isModalOpenEditBike}
        onClose={() => setIsModalOpenEditBike(false)}
        bikeToEdit={selectedBike}
        onConfirm={handleSubmitEditBike}
        hasError={hasError}
        onDelete={handleDeleteSingleBike}
      />

      {selectedHistoricEntry && (
        <HistoricModal
          isOpen={isModalOpenHistoric}
          onClose={() => setIsModalOpenHistoric(false)}
          entry={selectedHistoricEntry}
          onDelete={handleDeleteHistoricEntry}
        />
      )}
    </>
  )
}
