import "./ProfilePage.css"
import { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import IconButton from "../components/ui/IconButton";
import EditAddressModal from "../components/layout/modals/EditAddressModal";
import EditProfileModal from "../components/layout/modals/EditProfileModal";
import SuppressBikeModal from "../components/layout/modals/SuppressBikeModal";
import AddBikeModal from "../components/layout/modals/AddBikeModal"
import IconCard from '../components/ui/IconCard';
import { addBike, changeProfileInfo, changeAddress, suppressBike } from "../services/apiBack.mock";
import { getUserProfile, getUserBikes } from "../services/apiBack.mock";
import { useAuth } from "../context/AuthContext";

import IconBikeStandard from '../assets/bikes/standard.svg?react';
import IconBikeStandardElectric from '../assets/bikes/standard-electric.svg?react';
import IconBikeVTT from '../assets/bikes/vtt.svg?react';
import IconBikeVTT_Electric from '../assets/bikes/vtt-electric.svg?react';
import IconBikeRoute from '../assets/bikes/route.svg?react';
import { AiFillPlusCircle } from "react-icons/ai";
import { FaHome, FaUserEdit } from "react-icons/fa";
import { MdOutlineWork, MdEditLocationAlt } from "react-icons/md";
import { MdBatteryChargingFull, MdDelete } from "react-icons/md";

export default function ProfilePage() {
  const { user, token, userBikes, updateBikes } = useAuth();
  console.log("Données utilisateur dans ProfilePage :", user);
  console.log("Vélos dans ProfilePage :", userBikes);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenInfo, setIsModalOpenInfo] = useState(false);
  const [isModalOpenAddress, setIsModalOpenAddress] = useState(false);
  const [isModalOpenSuppress, setIsModalOpenSuppress] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [birthDate, setBirthdate] = useState(user?.birth_date || "");
  const [level, setLevel] = useState(user?.sport_level || "");
  const [homeAddress, setHomeAddress] = useState(user?.home_address || "");
  const [workAddress, setWorkAddress] = useState(user?.work_address || "");
  const [bikes, setBikes] = useState(userBikes || []);
  const [password, setPassword] = useState("");

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

  const handleBike = (bike, index) => {
    const isElec = String(bike.isElectric) === "1" || bike.isElectric === true;
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
      />
    );
  };

  const handleSubmitAddBike = async (newBike) => {
    try {
      await addBike(token, newBike.name, newBike.type, newBike.isElectric);
      const response_bikes = await getUserBikes(token);
      updateBikes(response_bikes);
      setIsModalOpen(false);
    } catch (error) {
      setHasError(true);
    }
  };

  const handleSubmitInfo = async (updatedData) => {
    try {
      await changeProfileInfo(
        token,
        updatedData.firstName,
        updatedData.lastName,
        updatedData.email,
        updatedData.birthDate,
        updatedData.password,
        updatedData.level
      );

      setFirstName(updatedData.firstName);
      setLastName(updatedData.lastName);
      setEmail(updatedData.email);
      setBirthdate(updatedData.birthDate);
      setPassword(updatedData.password);
      setLevel(updatedData.level);

      setIsModalOpenInfo(false);
    } catch (error) {
      setHasError(true);
    }
  };

  const handleSubmitAddress = async (updatedAddresses) => {
    try {
      await changeAddress(token, updatedAddresses.homeAddress, updatedAddresses.workAddress);
      setHomeAddress(updatedAddresses.homeAddress);
      setWorkAddress(updatedAddresses.workAddress);
      setIsModalOpenAddress(false);
    } catch (error) {
      setHasError(true);
    }
  };

  const handleSuppressBike = async (indexesToDelete) => {
    const bikesToProcess = indexesToDelete.map(i => bikes[i]);

    try {
      for (const bike of bikesToProcess) {
        await suppressBike(token, bike);
      }
      setBikes(bikes.filter((_, i) => !indexesToDelete.includes(i)));
      setIsModalOpenSuppress(false);
    } catch (error) {
      setHasError(true);
    }

  };

  return (
    <>
      <Header page="profil" />
      <div className="profile-page">

        <div className="title">
          <h1>{firstName} {lastName}</h1>
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
              <div><FaHome size={15} /> <strong>Domicile :</strong> {homeAddress}</div>
              <div><MdOutlineWork size={15} /> <strong>Travail :</strong> {workAddress}</div>
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
            <h2>Historique</h2>
            <div className="historic">
            </div>
          </div>

          <div className="profile-section">
            <h2>Statistiques</h2>
            <div className="statistic">
            </div>
          </div>

        </div>
      </div>

      <EditProfileModal
        isOpen={isModalOpenInfo}
        hasError={hasError}
        onClose={() => setIsModalOpenInfo(false) || setHasError(false)}
        onConfirm={handleSubmitInfo}
        userData={{ firstName, lastName, email, birthDate, level, password }}
      />

      <EditAddressModal
        isOpen={isModalOpenAddress}
        hasError={hasError}
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

    </>
  )
}
