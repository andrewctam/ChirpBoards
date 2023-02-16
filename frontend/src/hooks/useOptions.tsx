import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";

const useOptions = (postId: string,
                    oldText: string,
                    isOwner: boolean, 
                    isPinned: boolean | null,
                    userRechirped: boolean | null): [dots: JSX.Element, editor: JSX.Element | null] => {

    const [showOptions, setShowOptions] = useState(false)
    const [showEditor, setShowEditor] = useState(false)
    const [showVerifyDelete, setShowVerifyDelete] = useState(false)
    const [editedText, setEditedText] = useState("");
    const [localRechirped, setLocalRechirped] = useState(false);

    const userInfo = useContext(UserContext);
    const dotsRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate()
    
    useEffect(() => {
        setEditedText(oldText)
    }, [oldText])

    useEffect(() => {
        setLocalRechirped(userRechirped ?? localRechirped)
        // eslint-disable-next-line
    }, [userRechirped])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dotsRef.current && !(dotsRef.current as HTMLDivElement).contains(e.target as Node)) {
                setShowOptions(false);
            }
        }

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
        // eslint-disable-next-line
    }, [dotsRef]);


    const rechirp = async (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        
        if (!userInfo.state.username) {
            navigate("/signin")
        }

        let type = "rechirp"
        if (localRechirped)
            type = "undoRechirp"

        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
            `mutation {
                ${type}(postId: "${postId}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
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

        console.log(response)

        if (response.data[type].endRes === null) {
            return;
        } else 
            setLocalRechirped(!localRechirped)
    }


    const editPost = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (!userInfo.state.username || editedText.length === 0 || editedText === oldText) {
            return;
        }

        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
            `mutation {
                editPost(newText: """${editedText}""", postId: "${postId}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
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

        console.log(response)

        if (!response.data.editPost) {
            alert("Error!")
            return
        }

        window.location.reload();

    }


    const pinPost = async (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();

        if (!userInfo.state.username) {
            return;
        }

        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
            `mutation {
                pinPost(postId: "${postId}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
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

        console.log(response)

        window.location.reload();
    }
    
    const deletePost = async (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();

        if (!userInfo.state.username) {
            return;
        }

        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
            `mutation {
                deletePost(postId: "${postId}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
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

        console.log(response)

        window.location.reload();
    }



    const editor =
        (<form onSubmit = {editPost} className = "w-full mx-auto h-24 mb-6 bg-black/5 border border-black/25 relative rounded">
            <textarea 
                value = {editedText} 
                onChange = {(e) => setEditedText(e.target.value)} 
                className = "w-full h-full bg-transparent p-2 resize-none focus:outline-none text-white"/>


            <div className = "absolute -bottom-3 right-4">
                <button className = "bg-rose-300 text-xs sm:text-sm text-black border border-black/20 rounded shadow-md px-2 py-1" 
                    onClick = {() => {setShowEditor(false)}}>
                    Cancel
                </button>

                <button className = "bg-[#b9cfe2] disabled:bg-gray-200 disabled:text-black/50  text-xs sm:text-sm text-black border border-black/20 rounded shadow-md -bottom-3 right-4 px-2 py-1 ml-2" 
                    onClick = {editPost}
                    disabled = {editedText.length === 0}>
                    Save
                </button>
            </div>
        </form>)
    

    const dots = (
        <>
            <div ref = {dotsRef} className = "absolute right-2 bottom-1 text-white select-none cursor-pointer">
                <div onClick = {() => {setShowOptions(!showOptions); setShowVerifyDelete(false)}}>
                    ...
                </div>

                <div className = "relative">
                {showOptions ?
                    <ul className = "absolute top-0 right-4 md:left-4 rounded rounded-tr-none md:rounded-tl-none md:rounded-tr bg-[#b9cfe2] border border-black/20 z-50 text-sm px-2 py-1 w-fit text-black whitespace-nowrap">
                        {isOwner ? 
                            <>
                                <li onClick = {() => {setShowEditor(true); setShowOptions(false)}}>Edit</li>

                                {isPinned !== null ? 
                                    <li onClick = {pinPost} className = "mt-1">{isPinned ? "Unpin" : "Pin"}</li>
                                : null}

                                {showVerifyDelete ? 
                                <li>
                                    <div onClick = {deletePost} className = "text-rose-500 mt-2 sm:mt-1">Confirm</div>
                                </li>
                                : <li onClick = {() => setShowVerifyDelete(!showVerifyDelete)} className = "mt-1">Delete</li>}
                            </> 
                            :
                            <li onClick = {rechirp}>{localRechirped ? "Undo Rechirp" : "Rechirp"}</li>
                        }
                    </ul> : null}
                </div>
            </div>
        </>
    )


    return [dots, showEditor ? editor : null];
}

export default useOptions