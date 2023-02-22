import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../App";

interface PictureInputProps {
    close: () => void,
}

const PictureInput = (props: PictureInputProps) => {
    const [image, setImage] = useState<File | null>(null);
    const [msg, setMsg] = useState<string>("");
    const userInfo = useContext(UserContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const uploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = (e.target as HTMLInputElement).files?.[0]

        if (file) {
            setImage(file)
        }
    }

    useEffect(() => {
        if (!image)
            return

        const canvas = canvasRef.current;
        if (!canvas)
            return

        const ctx = canvas.getContext("2d");
        if (!ctx)
            return


        const img = new Image();
        img.src = URL.createObjectURL(image);
        img.onload = () => {
            ctx.drawImage(img, 0, 0, 100, 100);
        }

    }, [image, canvasRef, canvasRef.current])

    const saveNewProfilePicture = async () => {
        if (!canvasRef.current || !inputRef.current)     
            return

        const base64Image = canvasRef.current.toDataURL("image/jpg").split(",")[1];
        
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
            `mutation {
                changeProfilePicture(username: "${userInfo.state.username}", base64Image: "${base64Image}", sessionToken: "${userInfo.state.sessionToken}") {
                    msg
                    endRes
                }
            }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        }).then(res => res.json())

        setMsg(response.data.changeProfilePicture.msg)
        setImage(null)

        inputRef.current.value = ""
    }


    return (
    <>
        <div className = "mb-1">Upload New Image</div>
        <input ref = {inputRef} type = "file" accept = "image/*" className = "text-white w-full mx-auto bg-black/10 rounded-xl p-2 mb-4" onChange = {uploadImage}/>

        {
            image ?
                <canvas ref = {canvasRef} className = "mx-auto mb-4 rounded-full" width = "100" height = "100"></canvas> 
            : null
        }

        <p className = "text-white break-words my-3">{msg}</p>


        <button onClick = {props.close} className = "text-sm text-white px-4 py-2 mx-auto my-2 mr-2 bg-rose-700/30 rounded-xl border border-black/50">
            Cancel
        </button>

        <button onClick = {saveNewProfilePicture} disabled = {!image} className = "text-sm text-white px-4 py-2 mx-auto my-2 bg-black/10 rounded-xl border border-black/50 disabled:bg-white/5 disabled:text-gray-100/50">
            Save Changes
        </button>
    </>)
}

export default PictureInput
