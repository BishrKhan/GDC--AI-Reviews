/**
 * Profile Page
 * User profile, settings, interests management
 * DESIGN: Clean form, green accents, logout button
 */

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { mockCategories } from "@/lib/mockApi";

interface ProfilePageProps {
  onNavigate?: (page: string) => void;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, setUser, updateInterests, logout, setCurrentPage } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    dob: user.dob || "",
    gender: user.gender || "prefer-not",
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    user.interests || []
  );

  const handleSave = () => {
    setUser({
      ...formData,
      gender: formData.gender as any,
    });
    updateInterests(selectedInterests);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    setCurrentPage("home");
    if (onNavigate) {
      onNavigate("home");
    }
  };

  const handleToggleInterest = (categoryId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <AppLayout onNavigate={onNavigate}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">Profile</h1>
          <p className="text-lg text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {user.isGuest ? (
          // Guest State
          <div className="bg-card border border-border rounded-lg p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-foreground">
              Sign in to personalize your experience
            </h2>
            <p className="text-muted-foreground">
              Create an account to save your wishlist, preferences, and chat history
            </p>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base h-12"
              onClick={() => setIsEditing(true)}
            >
              Create Account
            </Button>
          </div>
        ) : (
          <>
            {/* Profile Info */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Account Info</h2>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </div>

              {isEditing ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-base font-semibold">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="mt-2 h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-base font-semibold">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="mt-2 h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dob" className="text-base font-semibold">
                      Date of Birth
                    </Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) =>
                        setFormData({ ...formData, dob: e.target.value })
                      }
                      className="mt-2 h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Gender
                    </Label>
                    <RadioGroup
                      value={formData.gender}
                      onValueChange={(value) =>
                        setFormData({ ...formData, gender: value as any })
                      }
                    >
                      <div className="space-y-2">
                        {["male", "female", "non-binary", "prefer-not"].map(
                          (gender) => (
                            <label
                              key={gender}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <RadioGroupItem value={gender} id={`gender-${gender}`} />
                              <span className="font-medium text-foreground capitalize">
                                {gender === "prefer-not" ? "Prefer not to say" : gender}
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    </RadioGroup>
                  </div>

                  <Button
                    onClick={handleSave}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12"
                  >
                    Save Changes
                  </Button>
                </div>
              ) : (
                // View Mode
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formData.name || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formData.email || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formData.dob || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="text-lg font-semibold text-foreground capitalize">
                      {formData.gender === "prefer-not"
                        ? "Prefer not to say"
                        : formData.gender}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Interests */}
            {isEditing && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-bold text-foreground">Interests</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mockCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleToggleInterest(category.id)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${
                        selectedInterests.includes(category.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:border-primary"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Logout */}
            <Button
              variant="outline"
              className="w-full h-12 font-semibold text-base border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </>
        )}
      </div>
    </AppLayout>
  );
}
