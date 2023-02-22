import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";

function PostComposer() {
    const [composedChirp, setComposedChirp] = useState("");

    const [image, setImage] = useState<File | null>(null);
    const [imageURL, setImageURL] = useState<string>("");

    const uploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = (e.target as HTMLInputElement).files?.[0]

        if (file) {
            setImage(file)
            setImageURL(URL.createObjectURL(file))
        }
    }
            
    const uploadRef = useRef<HTMLInputElement>(null);


    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();

    const userInfo = useContext(UserContext);
    
    const updateComposedChirp = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = (e.target as HTMLTextAreaElement).value

        if (text.length > 500) {
            setComposedChirp(text.substring(0, 500))
            setErrorMsg("Character limit reached!")
            return
        }
        setErrorMsg("")
        setComposedChirp(text)
    }


    const createChirp = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (!userInfo.state.username) {
            navigate(`/signin?return=${window.location.pathname}`)
            return;
        }

        if (!composedChirp) {
            setErrorMsg("Text can not be blank!")
            return
        }

        let imageData = ""
        if (image) {
            const base64Image = await convertToBase64(image);
            if (typeof base64Image === "string") {
                imageData = `, base64Image: "${base64Image}"`
            }
        }

        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
            `mutation {
                createPost(text: """${composedChirp}"""${imageData}, username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                    post {
                        id
                    }
                }
            }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        }).then(res => res.json())

        console.log(response)

        if (!response.data.createPost) {
            alert("Error!")
            return
        }

        navigate(`/board/${response.data.createPost.post.id}`)
    }
    return (<form onSubmit={createChirp} className="w-full mb-12 bg-black/20 p-1 shadow-lg relative rounded">
        <textarea
            value={composedChirp}
            onChange={updateComposedChirp}
            className = "w-full h-40 bg-transparent p-2 resize-none focus:outline-none text-white"
            placeholder="Compose a chirp..." />

        <p className="text-white/75 text-xs ml-2 mb-2">
            {errorMsg ? errorMsg
                : `${composedChirp.length}/500 characters`}
        </p>

        {image ? 
            <button className="bg-rose-300 text-xs sm:text-sm text-black border border-black rounded shadow-md absolute -bottom-3 right-20 px-2 py-1"
                onClick={() => {
                    if (uploadRef.current) {
                        uploadRef.current.value = ""
                        setImage(null)
                        setImageURL("")
                    }
                }}
                >
                Remove Image
            </button>
            :
            <label htmlFor="file" className="bg-sky-200 text-xs sm:text-sm text-black border border-black rounded shadow-md absolute -bottom-3 right-20 px-2 py-1 cursor-pointer" >
                Attach Image
            </label>
        }

        {imageURL ? 
            <img src={imageURL} alt="preview" className="mx-auto max-h-[50vh] rounded my-8"/> : null
        }

        <input ref = {uploadRef} type="file" onChange={uploadImage} className="hidden" id="file" accept=".jpg, .png"/>


        <button className="bg-gray-300 disabled:bg-gray-400 disabled:text-black/50 text-xs sm:text-sm text-black border border-black rounded shadow-md absolute -bottom-3 right-4 px-2 py-1"
            onClick={createChirp}
            disabled = {composedChirp.length === 0}>
            Post
        </button>
    </form>)
}

const convertToBase64 = (file: File) => new Promise<string | ArrayBuffer | null>((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);

    fileReader.onload = () => {
        if (typeof fileReader.result === "string")
            resolve(fileReader.result.split(",")[1]);
        else 
            reject("Error converting to base64");
    };

    fileReader.onerror = (error) => {
        reject(error)
    };
});

export default PostComposer
