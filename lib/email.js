import FormData from "form-data";
import fetch from "node-fetch";

export async function sendEmail({ title, text }) {
  const formData = new FormData();
  formData.append(title, text);

  return await fetch(
    "https://getform.io/f/966b8de8-298d-432c-859e-cb5758b19e92",
    { method: "POST", body: formData }
  );
}
