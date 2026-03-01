import { useState } from "react";
import Header from "../components/layout/Header";
import IconButton from "../components/ui/IconButton";
import Button from "../components/ui/Button";
import "../components/ui/Input.css"
import "../components/ui/PopUp.css"
import "../components/ui/Form.css"
import { AiFillPlusCircle } from "react-icons/ai";
import { FaHome, FaUserEdit } from "react-icons/fa";
import { MdOutlineWork, MdEditLocationAlt } from "react-icons/md";
import "./ProfilePage.css"
import IconCard from '../components/ui/IconCard';
import IconBikeStandard from '../assets/bikes/standard.svg?react';
import IconBikeStandardElectric from '../assets/bikes/standard-electric.svg?react';
import IconBikeVTT from '../assets/bikes/vtt.svg?react';
import IconBikeVTT_Electric from '../assets/bikes/vtt-electric.svg?react';
import IconBikeRoute from '../assets/bikes/route.svg?react';
import { MdBatteryChargingFull } from "react-icons/md";
import { addBike, changeProfileInfo, changeAddress } from "../services/apiBack.mock";

export default function ProfilePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenInfo, setIsModalOpenInfo] = useState(false);
  const [isModalOpenAddress, setIsModalOpenAddress] = useState(false);
  const [bikeName, setBikeName] = useState("");
  const [bikeType, setBikeType] = useState("vtt");
  const [bikeIsElectric, setBikeIsElectric] = useState("");

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
  }

  const handleSubmitAddVelo = async (e) => {
          e.preventDefault();

          const newBike = {
            type: bikeType, 
            name: bikeName, 
            isElectric: bikeIsElectric
          };

          try {
              await addBike(bikeName, bikeType, bikeIsElectric);
              
              setBikes([...bikes, newBike]); 
      
              setBikeName("");
              setBikeType("vtt");
              setIsModalOpen(false);
          } catch (error) {
              console.error("Erreur lors de l'ajout du vélo", error);
          }
  
      };

  const handleSubmitInfo = async (e) => {
    e.preventDefault();

    try {
        await changeProfileInfo(firstName, lastName, email, birthDate, password, level);
        setIsModalOpenInfo(false);
    } catch (error) {
        console.error("Erreur lors de la modification du profil", error);
    }

};

  const handleSubmitAddress = async (e) => {
    e.preventDefault();

    try {
        await changeAddress(homeAddress, workAddress);
        setIsModalOpenAddress(false);
    } catch (error) {
        console.error("Erreur lors du changement d'adresse.", error);
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
          <div className="address-title">
            <h2>Mes adresses</h2>
            <IconButton className="button-address" onClick={() => setIsModalOpenAddress(true)}>Modifier mes adresses<MdEditLocationAlt size={20}/></IconButton>
          </div>
            <div className="address-section">
              <div><FaHome size={15}/> <strong>Domicile :</strong> {homeAddress}</div>
              <div><MdOutlineWork size={15}/> <strong>Travail :</strong> {workAddress}</div>
            </div>
        </div>

        <div className="profile-section">
          <h2>Mes vélos</h2>
          <div className="bike-section">
            {bikes.map((bike, index) => (handleBike(bike, index)))}
            <IconButton onClick={() => setIsModalOpen(true)}><AiFillPlusCircle size={40}/></IconButton>
          </div>
        </div>

      </div>
    </div>

    {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content form-container">
            <h2>Ajouter un vélo</h2>
            <form onSubmit={handleSubmitAddVelo}>

              <div className="input-container">
                <div className="input-group">
                  <label>Nom du vélo :</label>
                  <input className="input" type="text" placeholder="Ex: Nakamura Summit 700" value={bikeName}
                    onChange={(e) => setBikeName(e.target.value)} />
                </div>

                <div className="input-group">
                  <label>Type :</label>
                  <select className="input" value={bikeType} onChange={(e) => setBikeType(e.target.value)}>
                    <option value="vtt">VTT</option>
                    <option value="ville">Ville</option>
                    <option value="route">Route</option>
                  </select>
                </div>

                <div className="input-group">
                  <div className="form-group-checkbox">
                    <label>Électrique</label> 
                    <input type="checkbox" checked={bikeIsElectric} 
                    onChange={(e) => setBikeIsElectric(e.target.checked)} />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <Button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit" className="btn-add">Ajouter <AiFillPlusCircle size={13}/></Button>
              </div>
            </form>
          </div>
        </div>
      )}

        {isModalOpenInfo && (
        <div className="modal-overlay">
          <div className="modal-content form-container">
            <h2>Modifier mon profil</h2>
            <form onSubmit={handleSubmitInfo}>

              <div className="input-container">
                <div className="input-group">
                  <label>Prénom</label>
                  <input className="input" type="text" value={firstName}
                    onChange={(e) => setFirstName(e.target.value)} />
                </div>

                <div className="input-group">
                  <label>Nom</label>
                  <input className="input" type="text" value={lastName}
                    onChange={(e) => setLastName(e.target.value)} />
                </div>

                <div className="input-group">
                  <label>Adresse mail</label>
                  <input className="input" type="mail" value={email}
                    onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="input-group">
                  <label>Date de naissance</label>
                  <input className="input" type="date" value={birthDate}
                    onChange={(e) => setBirthdate(e.target.value)} />
                </div>

                <div className="input-group">
                  <label>Niveau sportif</label>
                  <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
                    <option value="debutant">Débutant</option>
                    <option value="intermediaire">Intermédiaire</option>
                    <option value="experimente">Experimenté</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Mot de passe</label>
                  <input className="input" type="text" value={password}
                    onChange={(e) => setPassword(e.target.value)} />
                </div>

              </div>

              <div className="modal-actions">
                <Button type="button" className="btn-cancel" onClick={() => setIsModalOpenInfo(false)}>Annuler</Button>
                <Button type="submit" className="btn-add">Modifier <FaUserEdit size={13}/></Button>
              </div>
            </form>
          </div>
        </div>
      )}

    {isModalOpenAddress && (
        <div className="modal-overlay">
          <div className="modal-content form-container">
            <h2>Modifier mes adresses</h2>
            <form onSubmit={handleSubmitAddress}>

              <div className="input-container">
          
                <div className="input-group">
                  <label><FaHome size={15}/>Adresse du domicile</label>
                  <input className="input" type="text" value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)} />
                </div>

                <div className="input-group">
                  <label><MdOutlineWork size={15}/>Adresse du travail</label>
                  <input className="input" type="text" value={workAddress}
                    onChange={(e) => setWorkAddress(e.target.value)} />
                </div>

              </div>

              <div className="modal-actions">
                <Button type="button" className="btn-cancel" onClick={() => setIsModalOpenAddress(false)}>Annuler</Button>
                <Button type="submit" className="btn-add">Modifier <MdEditLocationAlt size={13}/></Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  )
}
