const message = () => {
    let bhmodal = ``;                                               // Modal container
    const btn = document.getElementById("bh-defineBtn");            // Button to open the modal
    const span = document.getElementsByClassName("bh-close")[0];    // Close modal
    const bhmodalList = document.getElementById("bh-modal-list");   // Modal innerHTML

    // When the user clicks DEFINITION button, open the modal 
    btn.onclick = function() {
        ProcessedWords.sort();
        bhmodal = document.getElementById("bh-myModal");
        bhmodal.style.display = "block";
        let temp = `<dl>`;
        for (let i = 0; i < ProcessedWords.length; i++)
            temp += `<dt class="bh-modal-item" onclick='window.open("https://www.merriam-webster.com/dictionary/` 
            + ProcessedWords[i] + `", "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=50,left=700,width=750,height=600")'>`
                + `&nbsp;` + ProcessedWords[i] + `</dt>`;
        temp += `</dl>`;
        bhmodalList.innerHTML = temp;
        return;
    }

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        bhmodal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == bhmodal) {
            bhmodal.style.display = "none";
        }
    }
};
export default message;