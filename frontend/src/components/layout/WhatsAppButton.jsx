import { IoLogoWhatsapp } from 'react-icons/io5';
import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function WhatsAppButton() {
  const [phone, setPhone] = useState('6281234567890');

  useEffect(() => {
    api.get('/settings/public')
      .then(({ data }) => {
        if (data.whatsapp_contact) setPhone(data.whatsapp_contact);
      })
      .catch(() => {});
  }, []);

  return (
    <a
      href={`https://wa.me/${phone}?text=Halo, saya butuh bantuan terkait TIKTIK`}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-btn"
      title="Hubungi Customer Service"
    >
      <IoLogoWhatsapp />
    </a>
  );
}
