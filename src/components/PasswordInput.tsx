import { useState } from "react";
import { Eye, EyeOff, WandSparkles } from "lucide-react";
import type { InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onGeneratePassword?: (password: string) => void;
};

function generateSecurePassword() {
  const characterGroups = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%&*+-=?"];
  const characters = characterGroups.join("");
  const randomIndex = (limit: number) => {
    const maxValue = 0x100000000;
    const cutoff = maxValue - (maxValue % limit);
    while (true) {
      const value = crypto.getRandomValues(new Uint32Array(1))[0];
      if (value < cutoff) return value % limit;
    }
  };
  const password = characterGroups.map((group) => group[randomIndex(group.length)]);

  while (password.length < 16) {
    password.push(characters[randomIndex(characters.length)]);
  }

  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
  }

  return password.join("");
}

function PasswordInput(props: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { onGeneratePassword, ...inputProps } = props;

  return (
    <span className="password-field">
      <input {...inputProps} className={`password-input ${inputProps.className ?? ""} ${onGeneratePassword ? "password-input-generatable" : ""}`.trim()} type={isVisible ? "text" : "password"} />
      {onGeneratePassword && <button
        className="password-generate-button"
        type="button"
        title="Generate secure password"
        onClick={() => onGeneratePassword(generateSecurePassword())}
      >
        <WandSparkles size={14} aria-hidden="true" />
        Generate
      </button>}
      <button
        className="password-visibility-toggle"
        type="button"
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        title={isVisible ? "Hide password" : "Show password"}
        onClick={() => setIsVisible((visible) => !visible)}
      >
        {isVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </span>
  );
}

export default PasswordInput;