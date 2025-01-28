import { LAMPORTS_PER_SOL } from './constants';

export async function validateAddress(address: string): Promise<boolean> {
  // TO DO: implement address validation logic here
  return true; // or false
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): number {
  return sol * LAMPORTS_PER_SOL;
}

export function getDateFromTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

  // Format the date
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return formattedDate;
}

export function modifySentence(
  sentence: string,
  {
    removeLastS = true,
    removeFirstThe = true,
  }: {
    removeLastS?: boolean;
    removeFirstThe?: boolean;
  } = {},
): string {

  console.log({ sentence });
  // Trim to ensure no leading or trailing spaces affect processing
  let modifiedSentence = sentence.trim();

  // Remove "the" from the beginning of the sentence if required
  if (removeFirstThe) {
    const theRegex = /^the\s+/i; // Match "the" at the beginning, case-insensitive
    modifiedSentence = modifiedSentence.replace(theRegex, '');
  }
  // Split the sentence into words
  const words = modifiedSentence.split(' ');

  // If removeLastS is true, modify only the last word
  if (removeLastS && words.length > 0) {
    const lastWord = words[words.length - 1];
    // Match plural suffixes only at the end of the sentence
    const pluralRegex = /(\w+)(ies|s|es)$/i;
    const match = lastWord.match(pluralRegex);

    if (match) {
      if (match[2].toLowerCase() === 'ies') {
        // Convert "ies" to "y"
        words[words.length - 1] = match[1] + 'y';
      } else {
        // Remove "s" or "es"
        words[words.length - 1] = match[1];
      }
    }
  }

  // Join the words back into a sentence
  return words.join(' ');
}
