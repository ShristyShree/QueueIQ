/**
 * QUEUE OPERATING HOURS
 * Defines valid service windows per queue type.
 * The prediction engine refuses to return wait estimates outside these hours
 * and instead returns a { closed: true } result with a suggested best time.
 *
 * open / close are integers in 24h format (inclusive on both ends).
 */

const QUEUE_HOURS = {
  doctor:  { open: 9,  close: 17, label: "9am – 5pm",  icon: "🩺" },
  billing: { open: 8,  close: 20, label: "8am – 8pm",  icon: "🧾" },
  pharmacy:{ open: 7,  close: 22, label: "7am – 10pm", icon: "💊" },
};

export default QUEUE_HOURS;
