import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../App";
import UserPhoto from "../UserPhoto";

interface ChangePictureProps {
    close: () => void,
}

const ChangePicture = (props: ChangePictureProps) => {
    const [image, setImage] = useState<File | null>(null);
    const [msg, setMsg] = useState<string>("");
    const [currentPictureURL, setCurrentPictureURL] = useState<string>("");
    const [userColor, setUserColor] = useState<string>("");
    const userInfo = useContext(UserContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [changesMade, setChangesMade] = useState<boolean>(false);

    useEffect(() => {
        getUserCurrentProfilePicture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


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

    }, [image, canvasRef])

    const uploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = (e.target as HTMLInputElement).files?.[0]

        if (file) {
            setImage(file)
            setChangesMade(true);
        }
    }
        
    const getUserCurrentProfilePicture = async () => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {
            user(username: "${userInfo.state.username}") {
                pictureURL
                userColor
                }
            }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        }).then(res => res.json())


        setCurrentPictureURL(response.data.user.pictureURL)
        setUserColor(response.data.user.userColor)
    }



    const saveNewProfilePicture = async () => {
        let base64Image = "";

        if (canvasRef.current && inputRef.current) {
            base64Image = canvasRef.current.toDataURL("image/jpg").split(",")[1];
        inputRef.current.value = ""
    }

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
        setTimeout(() => {
            setMsg("")
        }, 3000)

        setChangesMade(false);
        await getUserCurrentProfilePicture();
    }

    return (
    <>
        <input id = "pfpUpload" ref = {inputRef} type = "file" accept = "image/*" className = "hidden text-white w-full mx-auto bg-black/10 rounded-xl p-2 mb-2" onChange = {uploadImage}/>

        <div className = "bg-black/10 p-6 w-fit min-w-[200px] mx-auto rounded-xl">

            {image ? //upload image overrides current picture
                <canvas ref = {canvasRef} onClick = {() => {
                    if (inputRef.current)
                        inputRef.current.click()

                }} className = "mx-auto rounded-full cursor-pointer" width = "100" height = "100"></canvas> 
            :  
                <div className = "cursor-pointer" onClick = {() => {
                    if (inputRef.current)
                        inputRef.current.click()

                }}>
                <UserPhoto
                    url = {currentPictureURL}
                        userColor = {userColor}
                    size = {100}
                />
            </div>
            }

            <label htmlFor="pfpUpload" className = "select-none block mt-6 w-fit mx-auto text-green-200 cursor-pointer">
                Upload Image
            </label>

            { image || currentPictureURL ?
                <div onClick = {() => {
                        setChangesMade(true);
                        setImage(null)
                        setCurrentPictureURL("")
                        if (inputRef.current)
                            inputRef.current.value = ""
                    }}
                    className = "select-none block mt-2 w-fit mx-auto text-red-200 cursor-pointer">
                        
                    Remove Image
                </div>
            : null }
        </div>


        <p className = "text-white break-words my-3">{msg}</p>

        <button onClick = {props.close} className = "text-sm text-white px-4 py-2 mx-auto my-2 mr-2 bg-rose-700/30 rounded-xl border border-black/50">
            Cancel
        </button>

        <button onClick = {saveNewProfilePicture} disabled = {!changesMade} className = "text-sm text-white px-4 py-2 mx-auto my-2 bg-black/10 rounded-xl border border-black/50 disabled:bg-white/5 disabled:text-gray-100/50">
            Save Changes
        </button>

    </>)
}

export default ChangePicture
