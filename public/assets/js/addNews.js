let uploadButton = document.getElementById("upload-button");
let chosenImage = document.getElementById("chosen-image");
let fileName = document.getElementById("file-name");
let container = document.querySelector(".container");
let error = document.getElementById("error");
let imageDisplay = document.getElementById("image-display");

const fileHandler = (file, name, type) => {
    if (type.split("/")[0] !== "image") {
        //File Type Error
        error.innerText = "Please upload an image file";
        return false;
    }
    error.innerText = "";
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
        //image and file name
        let imageContainer = document.createElement("figure");
        let img = document.createElement("img");
        img.src = reader.result;
        imageContainer.appendChild(img);
        imageContainer.innerHTML += `<figcaption>${name}<div class="close-icon" onclick="removeImage(this)"><i class="fa-solid fa-xmark"></i></div></figcaption>`;
        imageDisplay.appendChild(imageContainer);
    };
};

function removeImage(closeIcon) {
    let figure = closeIcon.parentNode.parentNode; // Get the <figure> element
    imageDisplay.removeChild(figure); // Remove the <figure> element from the display
}

//Upload Button
uploadButton.addEventListener("change", () => {
    imageDisplay.innerHTML = "";
    Array.from(uploadButton.files).forEach((file) => {
        fileHandler(file, file.name, file.type);
    });
});

container.addEventListener(
    "dragenter",
    (e) => {
        e.preventDefault();
        e.stopPropagation();
        container.classList.add("active");
    },
    false
);

container.addEventListener(
    "dragleave",
    (e) => {
        e.preventDefault();
        e.stopPropagation();
        container.classList.remove("active");
    },
    false
);

container.addEventListener(
    "dragover",
    (e) => {
        e.preventDefault();
        e.stopPropagation();
        container.classList.add("active");
    },
    false
);

container.addEventListener(
    "drop",
    (e) => {
        e.preventDefault();
        e.stopPropagation();
        container.classList.remove("active");
        let draggedData = e.dataTransfer;
        let files = draggedData.files;
        imageDisplay.innerHTML = "";
        Array.from(files).forEach((file) => {
            fileHandler(file, file.name, file.type);
        });
    },
    false
);

window.onload = () => {
    error.innerText = "";
};

textarea = document.querySelector("#newsContent");
        textarea.addEventListener('input', autoResize, false);
 
        function autoResize() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        }

        if (getCurrentTheme() === 'dark') {
            // Do something for dark theme
            // Get all elements with the class name "color_change"
    var elements = document.getElementsByClassName("color_change");
    
    // Loop through the collection and set the style for each element
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.color = "white";
    }
        } 