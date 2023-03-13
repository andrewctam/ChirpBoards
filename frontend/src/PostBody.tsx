import { useNavigate } from "react-router-dom"
import { Rechirper } from "./home/Chirp"
import UserPhoto from "./UserPhoto"

interface PostBodyProps {
    id: string
    username: string
    displayName: string
    userColor: string
    postDate: string
    pictureURL: string
    isEdited: boolean
    pinned?: boolean
    text: string
    imageURL?: string
    editor: JSX.Element | null
    rechirper?: Rechirper | undefined,
    allowClick?: boolean
}

const PostBody = (props: PostBodyProps) => {
    const navigate = useNavigate();

    return (
        <div className="text-white p-2 truncate relative">
            {props.rechirper ? 
                <div className = "text-xs ml-2 mb-2">
                    <a href={`/profile/${props.rechirper.username}`} style = {{color: props.rechirper.userColor ?? "white"}}>
                        {props.rechirper.displayName}
                    </a>

                    <span className = "text-sky-200">
                        {` rechirped on ${props.rechirper.dateRechirped}`}
                    </span>
                </div> 
            : null}

            <a href={`/profile/${props.username}`} className = {`absolute left-3 ${props.rechirper ? "top-8": "top-3"}`}>
                <UserPhoto
                    url = {props.pictureURL}
                    userColor = {props.userColor}
                    size = {40}
                />
            </a>

            <a href={`/profile/${props.username}`} className = {`absolute left-16 text-xs ${props.rechirper ? "top-9": "top-4"}`}>
                <span style = {{color: props.userColor}}>
                    {props.displayName}
                </span>
                <span className = "ml-1 "> 
                    {`@${props.username}`}
                </span>

                <span className = "block">
                    {`${props.postDate}`} 
                </span>                
            </a>

            <div className = "absolute top-1 right-8 text-xs font-extralight select-none">
                {props.isEdited ? 
                    <span className = "text-yellow-200">
                        {"edited"} 
                    </span>
                : null}

                {props.pinned ? 
                    <span className = "text-rose-300 ml-1">
                        {"pinned"} 
                    </span>
                : null}
            </div>

            {props.editor ? 
                <div className = "m-8">
                    {props.editor}
                    {props.imageURL ? 
                        <img src = {props.imageURL} alt = "" className = "mx-auto max-w-[95%] max-h-[400px] rounded my-4"/>
                    : null 
                    }
                </div> 
                :
                <div onClick={() => {
                    if (props.allowClick) {
                        navigate(`/board/${props.id}`); 
                        navigate(0)
                    }
                }} className={`w-full max-h-[600px] pt-12 pb-5 pl-14 m-0 overflow-y-hidden whitespace-pre-line text-sm break-all text-white ${props.allowClick ? "cursor-pointer" : null}`}>
                    
                    {props.text}

                    {props.imageURL ? 
                        <img src = {props.imageURL} alt = {props.username} className = "mx-auto max-w-[95%] max-h-[400px] rounded my-4"/>
                    : null }
                </div>
            }
    </div>
    )
}


export default PostBody