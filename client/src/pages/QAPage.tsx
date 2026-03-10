/**
 * Q&A Page
 * Demographic filters, poll grid, thumbs voting
 * DESIGN: 2x2 poll grid, demographic buttons, voting buttons
 */

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface QAPageProps {
  onNavigate?: (page: string) => void;
}

interface Poll {
  id: string;
  question: string;
  product: string;
  upvotes: number;
  downvotes: number;
  userVote?: "up" | "down";
}

export default function QAPage({ onNavigate }: QAPageProps) {
  const { user } = useAppStore();
  const [selectedGender, setSelectedGender] = useState<string>(user.gender || "all");
  const [selectedAge, setSelectedAge] = useState<string>("all");
  const [polls, setPolls] = useState<Poll[]>([
    {
      id: "poll-1",
      question: "Is iPhone 15 Pro worth the price?",
      product: "iPhone 15 Pro",
      upvotes: 1240,
      downvotes: 340,
    },
    {
      id: "poll-2",
      question: "Best noise-canceling headphones?",
      product: "Sony WH-1000XM5",
      upvotes: 2150,
      downvotes: 180,
    },
    {
      id: "poll-3",
      question: "Samsung Galaxy S24 vs iPhone 15?",
      product: "Samsung Galaxy S24",
      upvotes: 1890,
      downvotes: 520,
    },
    {
      id: "poll-4",
      question: "Is DJI Mini 3 good for beginners?",
      product: "DJI Mini 3",
      upvotes: 1650,
      downvotes: 210,
    },
  ]);

  const handleVote = (pollId: string, voteType: "up" | "down") => {
    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id === pollId) {
          const newPoll = { ...poll };
          if (poll.userVote === voteType) {
            // Remove vote
            if (voteType === "up") newPoll.upvotes--;
            else newPoll.downvotes--;
            newPoll.userVote = undefined;
          } else {
            // Add or switch vote
            if (poll.userVote === "up") newPoll.upvotes--;
            if (poll.userVote === "down") newPoll.downvotes--;
            if (voteType === "up") newPoll.upvotes++;
            else newPoll.downvotes++;
            newPoll.userVote = voteType;
          }
          return newPoll;
        }
        return poll;
      })
    );
  };

  const getVotePercentage = (upvotes: number, downvotes: number) => {
    const total = upvotes + downvotes;
    return total === 0 ? 0 : Math.round((upvotes / total) * 100);
  };

  return (
    <AppLayout onNavigate={onNavigate}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">Q&A</h1>
          <p className="text-lg text-muted-foreground">
            Community polls and product questions
          </p>
        </div>

        {/* Demographic Filters */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <h2 className="text-lg font-bold text-foreground">Filter by Demographics</h2>

          {/* Gender Filter */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Gender</Label>
            <RadioGroup value={selectedGender} onValueChange={setSelectedGender}>
              <div className="flex flex-wrap gap-3">
                {["all", "male", "female", "non-binary"].map((gender) => (
                  <label
                    key={gender}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-border cursor-pointer
                      hover:border-primary transition-colors duration-200"
                  >
                    <RadioGroupItem value={gender} id={`gender-${gender}`} />
                    <span className="font-medium text-foreground capitalize">
                      {gender === "all" ? "All" : gender}
                    </span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Age Filter */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Age Group</Label>
            <RadioGroup value={selectedAge} onValueChange={setSelectedAge}>
              <div className="flex flex-wrap gap-3">
                {["all", "20s", "30s", "40s", "50s", "60s", "70+"].map((age) => (
                  <label
                    key={age}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-border cursor-pointer
                      hover:border-primary transition-colors duration-200"
                  >
                    <RadioGroupItem value={age} id={`age-${age}`} />
                    <span className="font-medium text-foreground">
                      {age === "all" ? "All Ages" : age}
                    </span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Polls Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Community Polls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {polls.map((poll) => {
              const votePercentage = getVotePercentage(poll.upvotes, poll.downvotes);

              return (
                <div
                  key={poll.id}
                  className="bg-card border border-border rounded-lg p-6 space-y-4"
                >
                  {/* Product Tag */}
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                    {poll.product}
                  </div>

                  {/* Question */}
                  <h3 className="text-lg font-bold text-foreground">
                    {poll.question}
                  </h3>

                  {/* Vote Percentage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Yes</span>
                      <span className="font-bold text-foreground">
                        {votePercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${votePercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Vote Counts */}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{poll.upvotes.toLocaleString()} yes</span>
                    <span>{poll.downvotes.toLocaleString()} no</span>
                  </div>

                  {/* Vote Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button
                      variant={poll.userVote === "up" ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 flex items-center justify-center gap-2 ${
                        poll.userVote === "up"
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }`}
                      onClick={() => handleVote(poll.id, "up")}
                    >
                      <ThumbsUp size={16} />
                      Yes
                    </Button>
                    <Button
                      variant={poll.userVote === "down" ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 flex items-center justify-center gap-2 ${
                        poll.userVote === "down"
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }`}
                      onClick={() => handleVote(poll.id, "down")}
                    >
                      <ThumbsDown size={16} />
                      No
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
