import "./ProfilePage.css"
import { useState } from "react";
import Header from "../components/layout/Header";
import IconButton from "../components/ui/IconButton";
import EditAddressModal from "../components/layout/modals/EditAddressModal";
import EditProfileModal from "../components/layout/modals/EditProfileModal";
import SuppressBikeModal from "../components/layout/modals/SuppressBikeModal";
import AddBikeModal from "../components/layout/modals/AddBikeModal"
import IconCard from '../components/ui/IconCard';
import { addBike, changeProfileInfo, changeAddress, suppressBike } from "../services/apiBack.mock";

import IconBikeStandard from '../assets/bikes/standard.svg?react';
import IconBikeStandardElectric from '../assets/bikes/standard-electric.svg?react';
import IconBikeVTT from '../assets/bikes/vtt.svg?react';
import IconBikeVTT_Electric from '../assets/bikes/vtt-electric.svg?react';
import IconBikeRoute from '../assets/bikes/route.svg?react';
import { AiFillPlusCircle } from "react-icons/ai";
import { FaHome, FaUserEdit } from "react-icons/fa";
import { MdOutlineWork, MdEditLocationAlt } from "react-icons/md";
import { MdBatteryChargingFull, MdDelete} from "react-icons/md";


export default function ProfilePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenInfo, setIsModalOpenInfo] = useState(false);
  const [isModalOpenAddress, setIsModalOpenAddress] = useState(false);
  const [isModalOpenSuppress, setIsModalOpenSuppress] = useState(false);

  const [firstName, setFirstName] = useState("Henri");
  const [lastName, setLastName] = useState("Dupont");
  const [email, setEmail] = useState("henri.dupont@henridupont.com");
  const [birthDate, setBirthdate] = useState("17/10/2003");
  const [password, setPassword] = useState("henri33");
  const [level, setLevel] = useState("Intermédiaire");
  const [homeAddress, setHomeAddress] = useState("66 Avenue Carnot 33200 Bordeaux");
  const [workAddress, setWorkAddress] = useState("3 Avenue du Docteur Albert Schweitzer 33600 Pessac");

  const [bikes, setBikes] = useState([
    {type:"ville", isElectric:"1", name: ""}, 
    {type:"vtt", isElectric:"0", name:"Nakamura Summit 700"}, 
    {type:"route", isElectric:"0", name: ""}, 
    {type:"vtt", isElectric:"1", name: ""}
  ]);

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
      await addBike(newBike.name, newBike.type, newBike.isElectric);
      setBikes([...bikes, newBike]); 
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout du vélo", error);
    }
  };

const handleSubmitInfo = async (updatedData) => {
  try {
      await changeProfileInfo(
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
      console.error("Erreur lors de la modification du profil", error);
  }
};

  const handleSubmitAddress = async (updatedAddresses) => {
    try {
        await changeAddress(updatedAddresses.homeAddress, updatedAddresses.workAddress);
        setHomeAddress(updatedAddresses.homeAddress);
        setWorkAddress(updatedAddresses.workAddress);
        setIsModalOpenAddress(false);
    } catch (error) {
        console.error("Erreur lors du changement d'adresse.", error);
    }
};

  const handleSuppressBike = async (indexesToDelete) => {
    const bikesToProcess = indexesToDelete.map(i => bikes[i]);

    try{
      for (const bike of bikesToProcess) {
        await suppressBike(bike);
      }
      
      setBikes(bikes.filter((_, i) => !indexesToDelete.includes(i)));
      setIsModalOpenSuppress(false);
    } catch (error) {
      console.error("Erreur lors de la suppression du vélo", error);
    }
    
  };

  return (
    <>
    <Header page="profil" />
    <div className="profile-page">
      
      <div className="title">
        <h1>{firstName} {lastName}</h1>
        <IconButton className="button-modification" onClick={() => setIsModalOpenInfo(true)}>Modifier mon compte < FaUserEdit size={30}/></IconButton>
      </div>

      <div className="content">

        <div className="profile-section">
          <div className="section-title">
            <h2>Mes adresses</h2>
            <IconButton className="button-address" onClick={() => setIsModalOpenAddress(true)}>Modifier mes adresses<MdEditLocationAlt size={20}/></IconButton>
          </div>
            <div className="address-section">
              <div><FaHome size={15}/> <strong>Domicile :</strong> {homeAddress}</div>
              <div><MdOutlineWork size={15}/> <strong>Travail :</strong> {workAddress}</div>
            </div>
        </div>

        <div className="profile-section">
          <div className="section-title">
            <h2>Mes vélos</h2>
            <IconButton className="button-suppress-bike" onClick={() => setIsModalOpenSuppress(true)} >Supprimer un vélo <MdDelete size={20}/></IconButton>
          </div>

          <div className="bike-section">
            {bikes.map((bike, index) => (handleBike(bike, index)))}
            <IconButton onClick={() => setIsModalOpen(true)}><AiFillPlusCircle size={40}/></IconButton>
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
      onClose={() => setIsModalOpenInfo(false)}
      onConfirm={handleSubmitInfo}
      userData={{ firstName, lastName, email, birthDate, level, password }}
    />

    <EditAddressModal
      isOpen={isModalOpenAddress}
      onClose={() => setIsModalOpenAddress(false)}
      onConfirm={handleSubmitAddress}
    />

    <AddBikeModal 
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onConfirm={handleSubmitAddBike}
    />

    <SuppressBikeModal 
      isOpen={isModalOpenSuppress} 
      onClose={() => setIsModalOpenSuppress(false)}
      bikes={bikes}
      onConfirm={handleSuppressBike}
    />

    </>
  )
}
