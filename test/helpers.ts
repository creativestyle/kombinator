export function trimMultilineString(str:string, keepLines = true) {
  return str
    .split('\n') // Split the string into an array of lines
    .map((line) => line.trim()) // Trim each line
    .join(keepLines ? '\n' : ''); // Join the lines back into a string
}