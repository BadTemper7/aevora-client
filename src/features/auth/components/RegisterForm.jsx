import { AtSign, Mail, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTES } from "../../../app/config/routes";
import FormAlert from "../../../components/feedback/FormAlert";
import Button from "../../../components/ui/Button";
import Checkbox from "../../../components/ui/Checkbox";
import Input from "../../../components/ui/Input";
import PasswordInput from "../../../components/ui/PasswordInput";
import { useForm } from "../../../hooks/useForm";
import { useAuthStore } from "../../../stores/authStore";
import { validateRegister } from "../validation";
import PasswordStrength from "./PasswordStrength";
import SocialAuthButtons from "./SocialAuthButtons";

const linkClass = "font-semibold text-brand-ink hover:underline";

export default function RegisterForm() {
  const signUp = useAuthStore((state) => state.signUp);

  const form = useForm({
    initialValues: { name: "", username: "", email: "", password: "", terms: false },
    validate: validateRegister,
  });

  // On success the store updates and <GuestRoute /> sends the person to the app.
  const submit = form.handleSubmit(async (values) => {
    try {
      await signUp(values);
    } catch {
      throw new Error("We couldn't create your account. Check your details and try again.");
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {form.formError && <FormAlert>{form.formError}</FormAlert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Rey Santos"
          leftIcon={UserRound}
          {...form.field("name")}
        />
        <Input
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="reysantos"
          leftIcon={AtSign}
          {...form.field("username")}
        />
      </div>

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        leftIcon={Mail}
        {...form.field("email")}
      />

      <div>
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          placeholder="Create a password"
          {...form.field("password")}
        />
        <PasswordStrength password={form.values.password} />
      </div>

      <Checkbox
        label={
          <>
            I agree to the{" "}
            <Link to={ROUTES.terms} className={linkClass}>
              Terms of service
            </Link>{" "}
            and{" "}
            <Link to={ROUTES.privacy} className={linkClass}>
              Privacy policy
            </Link>
            .
          </>
        }
        {...form.checkbox("terms")}
      />

      <Button type="submit" size="lg" fullWidth loading={form.submitting}>
        {form.submitting ? "Creating account" : "Create account"}
      </Button>

      <div className="flex items-center gap-3 text-[13px] text-ink-faint" role="separator">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <SocialAuthButtons
        onSelect={(provider) =>
          form.setFormError(`${provider} sign-up isn't available yet. Create an account with your email instead.`)
        }
      />
    </form>
  );
}
