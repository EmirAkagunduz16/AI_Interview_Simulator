"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Card from "../../../../common/components/Card";
import Button from "../../../../common/components/Button";
import "./welcome-card.styles.scss";

const WelcomeCard = () => {
  const router = useRouter();

  const handleAccept = () => {
    router.push("/interview/details");
  };

  return (
    <Card title="Mülakatınızı Kabul Edin" className="welcome-card">
      <p className="welcome-card__description">
        Mülakata devam etmek için uygunluğunuzu onaylayın veya yeniden
        planlamayı tercih edin.
      </p>
      <div className="welcome-card__actions">
        <Button onClick={handleAccept}>Başla</Button>
      </div>
    </Card>
  );
};

export default WelcomeCard;
