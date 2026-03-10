/**
 * Onboarding Page
 * Post-signup flow: DOB, Gender, Interests
 * DESIGN: Large inputs, green accents, step-by-step
 */

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface OnboardingProps {
  onNavigate?: (page: string) => void;
}

export default function Onboarding({ onNavigate }: OnboardingProps) {
  const { user, setUser, setCurrentPage } = useAppStore();
  const [step, setStep] = useState(1);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState(user.gender || "prefer-not");

  const handleNext = () => {
    if (step === 1) {
      if (dob) {
        setUser({ dob });
      }
      setStep(2);
    } else if (step === 2) {
      setUser({ gender });
      setCurrentPage("interests");
      if (onNavigate) {
        onNavigate("interests");
      }
    }
  };

  const handleSkip = () => {
    setCurrentPage("home");
    if (onNavigate) {
      onNavigate("home");
    }
  };

  return (
    <AppLayout onNavigate={onNavigate}>
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                step >= 1 ? "bg-primary" : "bg-muted"
              }`}
            >
              1
            </div>
            <div
              className={`flex-1 h-1 ${step >= 2 ? "bg-primary" : "bg-muted"}`}
            />
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                step >= 2 ? "bg-primary" : "bg-muted"
              }`}
            >
              2
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Step {step} of 2
          </p>
        </div>

        {/* Step 1: DOB */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-foreground">
                When is your birthday?
              </h1>
              <p className="text-lg text-muted-foreground">
                This helps us personalize recommendations (optional)
              </p>
            </div>

            <div>
              <Label htmlFor="dob" className="text-lg font-semibold">
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="mt-4 h-14 text-base"
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleNext}
                className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base"
              >
                Continue
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1 h-12 font-semibold text-base"
              >
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Gender */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-foreground">
                What is your gender?
              </h1>
              <p className="text-lg text-muted-foreground">
                This helps us tailor product recommendations (optional)
              </p>
            </div>

            <RadioGroup value={gender} onValueChange={(value) => setGender(value as any)}>
              <div className="space-y-3">
                {[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "non-binary", label: "Non-Binary" },
                  { value: "prefer-not", label: "Prefer not to say" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-4 p-4 rounded-lg border-2 border-border cursor-pointer
                      hover:border-primary transition-colors duration-200"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <span className="text-lg font-semibold text-foreground">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </RadioGroup>

            <div className="flex gap-4">
              <Button
                onClick={handleNext}
                className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base"
              >
                Continue
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-12 font-semibold text-base"
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
