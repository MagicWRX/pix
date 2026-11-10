// Safe-space UI shared by every surface that creates names or posts:
// the account dialogue, and the flag notice that shows the offending
// words back in red with the appeal route (the Feedback page).
export function SafeSpaceFlagNotice({ words }: { words: string[] }) {
  if (words.length === 0) return null;
  return (
    <div className="pix-safe-space-flag" role="alert">
      <p className="pix-safe-space-flag-words" aria-label={`Flagged words: ${words.join(", ")}`}>
        {words.map((word, index) => (
          <span key={word}>{index > 0 ? ", " : ""}<mark className="pix-flagged-word">{word}</mark></span>
        ))}
      </p>
      <p>
        This word has been marked as a word that is not a safe space — if you disagree, please contact us to appeal your case.{" "}
        <a href="#feedback">Appeal through the Feedback page →</a>
      </p>
    </div>
  );
}

export function SafeSpaceDialogue() {
  return (
    <div className="pix-safe-space-dialogue" role="note" aria-label="PIX.MOV safe space agreement">
      <strong>PIX.MOV IS A SAFE SPACE</strong>
      <p>
        PIX.MOV does not allow hate speech, talk, or language — not in user names, list titles, reviews, or discussions.
        Names, titles, and posts are checked against the PIX flagged-word list before they are saved.
        If a word of yours is flagged and you believe it was used fairly, you can appeal through the Feedback page.
      </p>
    </div>
  );
}
