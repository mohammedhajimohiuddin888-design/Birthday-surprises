import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, RotateCcw, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  COUNTDOWN_BLOW_MUSIC_SRC,
  SURPRISE_BIRTHDAY_MUSIC_SRC,
  canStartCelebration,
  getCakePhaseAtTime,
  type BirthdayType,
} from "@/lib/birthday-flow";
import { createFileRoute } from "@tanstack/react-router";

type BirthdayStage = "welcome" | "cake" | "surprise";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A Birthday Surprise, Just for You" },
      {
        name: "description",
        content: "A little hand-drawn birthday moment, made just for someone special.",
      },
      { property: "og:title", content: "A Birthday Surprise, Just for You" },
      {
        property: "og:description",
        content: "A little hand-drawn birthday moment, made just for someone special.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Lilita+One&display=swap",
      },
    ],
  }),
  component: BirthdayExperience,
});

function BirthdayExperience() {
  const [name, setName] = useState("");
  const [birthdayType, setBirthdayType] = useState<BirthdayType | null>(null);
  const [stage, setStage] = useState<BirthdayStage>("welcome");
  const [countdown, setCountdown] = useState(4);
  const [candleOut, setCandleOut] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const countdownAudioRef = useRef<HTMLAudioElement | null>(null);
  const surpriseAudioRef = useRef<HTMLAudioElement | null>(null);
  const stageRef = useRef<BirthdayStage>("welcome");
  const isMutedRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (stage !== "cake") return;

    let transitioned = false;
    const startedAt = performance.now();
    const syncPhase = () => {
      if (transitioned) return;

      const countdownAudio = countdownAudioRef.current;
      const audioPlaying =
        countdownAudio !== null &&
        !countdownAudio.paused &&
        !countdownAudio.ended &&
        countdownAudio.currentTime > 0.05;
      const elapsedMs = audioPlaying
        ? countdownAudio.currentTime * 1000
        : performance.now() - startedAt;
      const phase = getCakePhaseAtTime(elapsedMs);

      setCountdown(phase.countdown);
      setCandleOut(phase.candleOut);

      if (phase.revealSurprise) {
        transitioned = true;
        if (countdownAudio) {
          countdownAudio.pause();
          countdownAudio.currentTime = 0;
        }
        const surpriseAudio = surpriseAudioRef.current;
        if (surpriseAudio) {
          surpriseAudio.currentTime = 0;
          surpriseAudio.muted = isMutedRef.current;
          void surpriseAudio.play().catch(() => {
            // Surprise screen remains visible even if browser blocks audio.
          });
        }
        stageRef.current = "surprise";
        setStage("surprise");
      }
    };

    const timer = window.setInterval(syncPhase, 50);
    const countdownAudio = countdownAudioRef.current;
    countdownAudio?.addEventListener("timeupdate", syncPhase);

    return () => {
      window.clearInterval(timer);
      countdownAudio?.removeEventListener("timeupdate", syncPhase);
    };
  }, [stage]);

  function beginCelebration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canStartCelebration(birthdayType, name)) return;
    setCountdown(4);
    setCandleOut(false);
    stageRef.current = "cake";

    const countdownAudio = countdownAudioRef.current;
    if (countdownAudio) {
      countdownAudio.currentTime = 0;
      countdownAudio.muted = isMutedRef.current;
      void countdownAudio.play().catch(() => {
        // Fallback timer drives the countdown if browser playback is blocked.
      });
    }

    // Unlock the surprise audio inside the same user gesture so it plays reliably after the blow-out.
    const surpriseAudio = surpriseAudioRef.current;
    if (surpriseAudio) {
      surpriseAudio.muted = true;
      surpriseAudio.currentTime = 0;
      void surpriseAudio
        .play()
        .then(() => {
          if (stageRef.current !== "surprise") {
            surpriseAudio.pause();
            surpriseAudio.currentTime = 0;
          }
          surpriseAudio.muted = isMutedRef.current;
        })
        .catch(() => {
          surpriseAudio.muted = isMutedRef.current;
        });
    }

    setStage("cake");
  }

  function replay() {
    const countdownAudio = countdownAudioRef.current;
    if (countdownAudio) {
      countdownAudio.pause();
      countdownAudio.currentTime = 0;
    }
    const surpriseAudio = surpriseAudioRef.current;
    if (surpriseAudio) {
      surpriseAudio.pause();
      surpriseAudio.currentTime = 0;
    }
    setCountdown(4);
    setCandleOut(false);
    stageRef.current = "welcome";
    setStage("welcome");
  }

  function toggleMute() {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (countdownAudioRef.current) {
        countdownAudioRef.current.muted = next;
      }
      if (surpriseAudioRef.current) {
        surpriseAudioRef.current.muted = next;
      }
      return next;
    });
  }

  const motionDuration = prefersReducedMotion ? 0.01 : 0.55;

  return (
    <main className="birthday-page min-h-screen overflow-hidden bg-background text-foreground">
      <div className="birthday-paper" aria-hidden="true" />
      <audio
        ref={countdownAudioRef}
        src={COUNTDOWN_BLOW_MUSIC_SRC}
        preload="auto"
        muted={isMuted}
      />
      <audio
        ref={surpriseAudioRef}
        src={SURPRISE_BIRTHDAY_MUSIC_SRC}
        preload="auto"
        muted={isMuted}
      />
      {stage !== "welcome" && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="sound-toggle-button"
          onClick={toggleMute}
          aria-pressed={isMuted}
          aria-label={isMuted ? "Unmute birthday music" : "Mute birthday music"}
        >
          {isMuted ? (
            <VolumeX size={16} aria-hidden="true" />
          ) : (
            <Volume2 size={16} aria-hidden="true" />
          )}
        </Button>
      )}
      <AnimatePresence mode="wait">
        {stage === "welcome" ? (
          <motion.section
            key="welcome"
            className="birthday-screen birthday-welcome"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -12 }}
            transition={{ duration: motionDuration }}
            aria-labelledby="welcome-title"
          >
            <div className="welcome-sparkle welcome-sparkle--left" aria-hidden="true">
              ✳
            </div>
            <div className="welcome-sparkle welcome-sparkle--right" aria-hidden="true">
              ✧
            </div>
            <div className="birthday-stamp" aria-hidden="true">
              <span>MAKE A</span>
              <Sparkles size={20} strokeWidth={1.8} />
              <span>WISH</span>
            </div>
            <div className="welcome-copy">
              <p className="birthday-eyebrow">A little something special</p>
              <h1 id="welcome-title">Who&apos;s Birthday Is It?</h1>
              <p className="welcome-subtitle">Let&apos;s make their day feel extra lovely.</p>
            </div>

            <form className="welcome-form" onSubmit={beginCelebration}>
              <fieldset className="birthday-type-fieldset">
                <legend className="field-label">It&apos;s for a...</legend>
                <div className="birthday-type-options">
                  <Button
                    type="button"
                    variant="outline"
                    className={`birthday-choice birthday-choice--girl ${birthdayType === "girl" ? "is-selected" : ""}`}
                    aria-pressed={birthdayType === "girl"}
                    onClick={() => setBirthdayType("girl")}
                  >
                    <span className="choice-emoji" aria-hidden="true">
                      👸
                    </span>
                    <span>Birthday Girl</span>
                    {birthdayType === "girl" && (
                      <Check className="choice-check" aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`birthday-choice birthday-choice--boy ${birthdayType === "boy" ? "is-selected" : ""}`}
                    aria-pressed={birthdayType === "boy"}
                    onClick={() => setBirthdayType("boy")}
                  >
                    <span className="choice-emoji" aria-hidden="true">
                      🤴
                    </span>
                    <span>Birthday Boy</span>
                    {birthdayType === "boy" && (
                      <Check className="choice-check" aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </fieldset>

              <div className="name-field">
                <label htmlFor="birthday-name" className="field-label">
                  Their lovely name
                </label>
                <Input
                  id="birthday-name"
                  name="name"
                  autoComplete="off"
                  maxLength={32}
                  placeholder="Enter Your Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="birthday-name-input"
                  required
                />
              </div>

              <Button
                type="submit"
                className="celebrate-button"
                disabled={!canStartCelebration(birthdayType, name)}
              >
                Let&apos;s Celebrate <span aria-hidden="true">✿</span>
              </Button>
            </form>
            <p className="welcome-footer">
              <span aria-hidden="true">♥</span> Made with a little extra love
            </p>
          </motion.section>
        ) : stage === "cake" ? (
          <motion.section
            key="cake"
            className="birthday-screen birthday-cake-screen"
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.03 }}
            transition={{ duration: motionDuration }}
            aria-live="polite"
            aria-label="Birthday candle countdown"
          >
            <div className="cake-message">
              <p className="birthday-eyebrow">A wish just for you</p>
              <h1>Blow the candle in...</h1>
              <AnimatePresence mode="wait">
                <motion.div
                  key={candleOut ? "wish" : countdown}
                  className="countdown-number"
                  initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.7, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.2, y: -10 }}
                  transition={{ duration: prefersReducedMotion ? 0.01 : 0.32 }}
                >
                  {candleOut ? "Make a wish!" : countdown}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className={`cake-art-wrap ${candleOut ? "is-candle-out" : ""}`}>
              <BirthdayCake candleOut={candleOut} />
            </div>
            <p className="cake-name-note">{name}&apos;s big day</p>
          </motion.section>
        ) : (
          <motion.section
            key="surprise"
            className="birthday-screen birthday-surprise-screen"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionDuration }}
            aria-labelledby="surprise-title"
          >
            <div className="surprise-topline">
              <span>YOUR SPECIAL DAY</span>
              <Sparkles size={16} aria-hidden="true" />
            </div>
            <Confetti />
            <div className="character-wrap">
              <BirthdayCat birthdayType={birthdayType} />
            </div>
            <div className="surprise-copy">
              <p className="birthday-eyebrow">Today is all about you</p>
              <h1 id="surprise-title">
                Happy Birthday,
                <br />
                <span>{name}!</span>
              </h1>
              <p className="birthday-wish">
                May your day be full of belly laughs, your favourite cake, and wishes that come
                true. You deserve all the happiness in the world!
              </p>
              <p className="birthday-signoff">
                Big hugs &amp; birthday magic <span aria-hidden="true">♥</span>
              </p>
            </div>
            <Button type="button" variant="outline" className="replay-button" onClick={replay}>
              <RotateCcw size={16} aria-hidden="true" /> Replay
            </Button>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}

function BirthdayCake({ candleOut }: { candleOut: boolean }) {
  return (
    <svg
      className="birthday-cake-art"
      viewBox="0 0 320 300"
      role="img"
      aria-label="A pink candle on a little birthday cake"
    >
      <ellipse className="cake-ground-shadow" cx="160" cy="255" rx="102" ry="14" />
      <ellipse className="cake-plate" cx="160" cy="234" rx="104" ry="28" />
      <ellipse className="cake-plate-inner" cx="160" cy="229" rx="82" ry="17" />
      <path className="cake-body" d="M80 151v62c0 22 35 39 80 39s80-17 80-39v-62H80Z" />
      <path
        className="cake-bottom-icing"
        d="M80 179c12 19 41 30 80 30s68-11 80-30v34c0 22-35 39-80 39s-80-17-80-39v-34Z"
      />
      <path
        className="cake-top"
        d="M80 151c0-18 36-33 80-33s80 15 80 33-36 33-80 33-80-15-80-33Z"
      />
      <path className="cake-candle-stick" d="M160 115V50" />
      <path className="cake-candle" d="M150 113h20v-46h-20z" />
      <path className="cake-candle-band" d="M150 79h20m-20 14h20" />
      {!candleOut ? (
        <g className="candle-flame">
          <path
            className="flame-outer"
            d="M160 56c-15-13-8-27 1-40 2 10 16 17 11 30-2 6-6 9-12 10Z"
          />
          <path className="flame-inner" d="M161 50c-5-6-2-12 2-17 1 5 7 8 4 14-1 2-3 3-6 3Z" />
        </g>
      ) : (
        <g className="candle-smoke" aria-hidden="true">
          <path d="M157 55c-9-11 10-13 3-23-5-8 5-10 5-18" />
          <path d="M168 54c8-8-7-11-1-18" />
        </g>
      )}
      <circle className="cake-sprinkle sprinkle-one" cx="115" cy="151" r="3" />
      <circle className="cake-sprinkle sprinkle-two" cx="204" cy="148" r="3" />
    </svg>
  );
}

function BirthdayCat({ birthdayType }: { birthdayType: BirthdayType | null }) {
  return (
    <svg
      className={`birthday-cat birthday-cat--${birthdayType ?? "girl"}`}
      viewBox="0 0 220 250"
      role="img"
      aria-label="A happy little birthday cat"
    >
      <ellipse className="cat-shadow" cx="112" cy="227" rx="58" ry="11" />
      <path
        className="cat-body"
        d="m60 82 5-47c1-7 7-8 12-3l23 20h25l22-20c5-5 11-4 12 3l5 47c16 12 24 31 24 57v44c0 11-7 18-18 18H67c-11 0-18-7-18-18v-44c0-26 3-45 11-57Z"
      />
      <path
        className="cat-face-patch"
        d="M81 89c11-13 47-13 59 0 10 12 9 40 0 51-8 10-49 10-59 0-9-11-10-39 0-51Z"
      />
      <path className="cat-belly" d="M75 169c0-16 14-27 35-27s35 11 35 27v26H75v-26Z" />
      <path className="cat-eye" d="M88 106v7m45-7v7" />
      <path className="cat-nose" d="m106 121 4 4 4-4" />
      <path className="cat-mouth" d="M110 125v5m0 0c-4 5-9 5-13 1m13-1c4 5 9 5 13 1" />
      <path className="cat-whiskers" d="m80 124-15-3m16 9-16 4m81-10 15-3m-16 9 16 4" />
      <path
        className="cat-arm"
        d="M63 144c-12 4-18 18-15 31 2 10 10 13 18 7l14-13m78-25c12 4 18 18 15 31-2 10-10 13-18 7l-14-13"
      />
      {birthdayType === "girl" ? (
        <g className="cat-bow" aria-hidden="true">
          <path d="m69 49-21-16c-6-5-11 2-7 8l17 20-13 18c-5 6 2 11 8 7l20-15 20 14c6 4 11-2 7-8L86 59l15-19c5-6-1-11-7-7L74 49Z" />
          <circle cx="72" cy="59" r="7" />
        </g>
      ) : (
        <g className="cat-party-hat" aria-hidden="true">
          <path d="m88 42 24-36 23 39c-14 8-32 7-47-3Z" />
          <circle cx="112" cy="7" r="6" />
          <path d="m101 33 22 4" />
        </g>
      )}
      <path className="cat-cheek" d="M72 120h12m64 0h12" />
      <path className="cat-birthday-badge" d="M169 76h17a9 9 0 0 1 9 9v17a9 9 0 0 1-9 9h-17Z" />
      <path className="badge-star" d="m179 85 2 5 5 1-5 2-2 5-2-5-5-2 5-1Z" />
    </svg>
  );
}

function Confetti() {
  return (
    <div className="confetti-field" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <span key={index} className={`confetti-piece confetti-piece--${(index % 6) + 1}`} />
      ))}
    </div>
  );
}
