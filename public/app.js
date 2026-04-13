async function getCode() {
    const number = document.getElementById("number").value;
    const result = document.getElementById("result");

    if (!number) {
        result.innerText = "❌ Please enter number";
        return;
    }

    result.innerText = "⏳ Generating code...";

    try {
        const res = await fetch("/pair?number=" + number);
        const data = await res.text();

        result.innerText = data;

    } catch (error) {
        result.innerText = "❌ Error connecting to server";
    }
}
