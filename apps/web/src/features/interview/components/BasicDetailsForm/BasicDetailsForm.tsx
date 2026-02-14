"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "../../../../common/hooks/useAppDispatch";
import { startInterview } from "../../store/interviewSlice";
import Card from "../../../../common/components/Card";
import Button from "../../../../common/components/Button";
import Input from "../../../../common/components/Input";
import "./basic-details-form.styles.scss";

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

const BasicDetailsForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Ad Soyad alani zorunludur";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Ad Soyad en az 2 karakter olmalidir";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-posta alani zorunludur";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Gecerli bir e-posta adresi giriniz";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefon numarasi zorunludur";
    } else if (!/^[0-9\s]{10,}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Gecerli bir telefon numarasi giriniz (en az 10 hane)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBack = () => {
    router.push("/interview/welcome");
  };

  const handleNext = () => {
    if (!validate()) return;

    // Start the interview directly (tutorial/demo/instructions removed)
    dispatch(startInterview());
    router.push("/interview/audio");
  };

  return (
    <Card title="Temel Bilgileri Doldurun" className="basic-details-form">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleNext();
        }}
      >
        <Input
          label="Adiniz Soyadiniz"
          placeholder="Ahmet Yilmaz"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
        />

        <Input
          label="E-posta"
          type="email"
          placeholder="ahmet.yilmaz@mail.com"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <Input
          label="Telefon Numarasi"
          type="tel"
          placeholder="532 123 45 67"
          prefix="+90"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
        />

        <div className="basic-details-form__actions">
          <Button variant="secondary" onClick={handleBack}>
            Geri
          </Button>
          <Button type="submit">Ileri</Button>
        </div>
      </form>
    </Card>
  );
};

export default BasicDetailsForm;
