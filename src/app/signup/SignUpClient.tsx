"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthAlert from "@/components/AuthAlert";
import AuthButton from "@/components/AuthButton";
import AuthField from "@/components/AuthField";
import AuthShell from "@/components/AuthShell";
import BirthdateField from "@/components/BirthdateField";
import EmailCodeScreen from "@/components/EmailCodeScreen";
import PasswordStrength from "@/components/PasswordStrength";
import { useLanguage, type MessageKey } from "@/lib/i18n";
import {
  birthdateToIso,
  NAME_MAX_LENGTH,
  validateBirthdate,
  validateEmail,
  validateName,
  validateNewPassword,
  type BirthdateParts,
  type FieldError,
} from "@/lib/authForm";
import { signUp } from "@/lib/account";
import { IS_SUPABASE_CONFIGURED } from "@/lib/supabase";
import { EXPLORE, SIGN_IN } from "@/lib/routes";

type Step = "name" | "birthdate" | "email" | "password";

const STEPS: Step[] = ["name", "birthdate", "email", "password"];

const QUESTION: Record<Step, { title: MessageKey; hint: MessageKey }> = {
  name: { title: "signUpStepName", hint: "signUpStepNameHint" },
  birthdate: { title: "signUpStepBirthdate", hint: "signUpStepBirthdateHint" },
  email: { title: "signUpStepEmail", hint: "signUpStepEmailHint" },
  password: { title: "signUpStepPassword", hint: "signUpStepPasswordHint" },
};

/**
 * Crear una cuenta, una pregunta cada vez.
 *
 * Cuatro pasos —nombre, fecha de nacimiento, correo y contraseña— en vez de
 * un formulario de cuatro casillas: cada pregunta ocupa la pantalla entera,
 * se contesta con un pulgar y la siguiente ya llama por su nombre a quien se
 * está registrando. Es la diferencia entre rellenar un trámite y empezar a
 * jugar, y es el mismo ritmo que una lección: una cosa, respuesta, siguiente.
 *
 * Cada paso se valida al pulsar Continuar, no antes: un error rojo mientras
 * todavía se está escribiendo el nombre es regañar a destiempo. La edad se
 * comprueba aquí (18 o más) y otra vez en la base al crear el perfil.
 *
 * Sin proyecto de Supabase configurado, el último paso enseña que las cuentas
 * aún no están en vez de fingir que se ha creado algo.
 */
export default function SignUpClient() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState<BirthdateParts>({
    day: "",
    month: "",
    year: "",
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<FieldError>(null);
  const [serverError, setServerError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const index = STEPS.indexOf(step);
  const firstName = name.trim().split(/\s+/)[0] ?? "";

  const goTo = (next: Step) => {
    setFieldError(null);
    setServerError(null);
    setStep(next);
  };

  const validate = (): FieldError => {
    switch (step) {
      case "name":
        return validateName(name);
      case "birthdate":
        return validateBirthdate(birthdate);
      case "email":
        return validateEmail(email);
      case "password":
        return validateNewPassword(password);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const error = validate();
    setFieldError(error);
    setServerError(null);
    if (error) return;

    if (step !== "password") {
      goTo(STEPS[index + 1]);
      return;
    }

    if (!IS_SUPABASE_CONFIGURED) {
      setComingSoon(true);
      return;
    }

    setBusy(true);
    const result = await signUp({
      name,
      birthdate: birthdateToIso(birthdate)!,
      email,
      password,
      language,
    });
    setBusy(false);

    if (!result.ok) {
      setServerError(result.error);
      // Un correo ya usado se arregla en el paso del correo, no en este.
      if (result.error === "authErrorEmailTaken") setStep("email");
      return;
    }

    if (result.value.needsConfirmation) {
      setSentTo(email.trim());
    } else {
      router.push(EXPLORE);
    }
  };

  if (sentTo) {
    // La cuenta existe pero falta activarla: el correo trae un código de
    // seis cifras que se escribe aquí mismo (ver `EmailCodeScreen`).
    return (
      <EmailCodeScreen
        email={sentTo}
        title={t("signUpDoneTitle", { name: firstName })}
        justSent
      />
    );
  }

  return (
    <AuthShell
      title={t(QUESTION[step].title, { name: firstName })}
      subtitle={t(QUESTION[step].hint)}
      comingSoon={comingSoon}
      onBack={index > 0 ? () => goTo(STEPS[index - 1]) : undefined}
      stepKey={step}
      progress={<StepProgress current={index} total={STEPS.length} />}
      footer={
        <>
          {t("authHasAccount")}{" "}
          <Link href={SIGN_IN} className="font-extrabold text-ink underline">
            {t("signIn")}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <div key={step} className="animate-fade-up">
          {step === "name" && (
            <AuthField
              label={t("authName")}
              type="text"
              value={name}
              onChange={setName}
              error={fieldError}
              autoComplete="name"
              maxLength={NAME_MAX_LENGTH}
              autoFocus
            />
          )}

          {step === "birthdate" && (
            <BirthdateField
              value={birthdate}
              onChange={setBirthdate}
              error={fieldError}
              autoFocus
            />
          )}

          {step === "email" && (
            <AuthField
              label={t("authEmail")}
              type="email"
              value={email}
              onChange={setEmail}
              error={fieldError}
              autoComplete="email"
              autoFocus
            />
          )}

          {step === "password" && (
            <AuthField
              label={t("authPassword")}
              type="password"
              value={password}
              onChange={setPassword}
              error={fieldError}
              autoComplete="new-password"
              autoFocus
            >
              <PasswordStrength password={password} />
            </AuthField>
          )}
        </div>

        <AuthAlert error={serverError} />

        <AuthButton busy={busy} busyLabel={t("authCreating")}>
          {step === "password" ? t("createAccount") : t("authContinue")}
        </AuthButton>
      </form>
    </AuthShell>
  );
}

/**
 * El camino del registro: una celda del panal por pregunta, que se llena al
 * contestarla. Dice cuánto falta sin un número que leer, y el lector de
 * pantalla oye "paso 2 de 4".
 */
function StepProgress({ current, total }: { current: number; total: number }) {
  const { t } = useLanguage();

  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={t("signUpProgressAria", { step: current + 1, total })}
      className="flex items-center justify-center"
    >
      {Array.from({ length: total }, (_, cell) => {
        const done = cell < current;
        const active = cell === current;
        return (
          <div key={cell} className="flex items-center">
            {cell > 0 && (
              <span
                aria-hidden="true"
                className={`h-1.5 w-8 rounded-full transition-colors duration-500 sm:w-12 ${
                  cell <= current ? "bg-sun" : "bg-ink/10"
                }`}
              />
            )}
            <span
              aria-hidden="true"
              className={`hex-cell flex h-11 w-10 items-center justify-center text-base font-extrabold transition-colors duration-500 ${
                done
                  ? "bg-sun text-black"
                  : active
                    ? "animate-pop bg-ink text-sun"
                    : "bg-ink/10 text-ink/40"
              }`}
            >
              {done ? "✓" : cell + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
}
