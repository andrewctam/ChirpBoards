import { useContext } from "react"
import { PostInfo, UserContext } from "../App"
import Vote from "../boards/Vote"
import useOptions from "../hooks/useOptions"
import PostBody from "../PostBody"

export type Rechirper = {
    username: string
    displayName: string
    userColor: string
    dateRechirped: string
}   

interface ChirpProps extends PostInfo {
    pinned: boolean | null
    userColor: string

    //user who rechirped, only relevant on profile where they are displayed. 
    //different from rechirpStatus (which is if the current user rechirped this post)
    rechirper?: Rechirper | undefined 
}

function Chirp(props: ChirpProps) {
    const userInfo = useContext(UserContext);
    const [dots, editor] = useOptions(props.id, props.text, userInfo.state.username === props.authorUsername, props.pinned, false, props.rechirpStatus)
    return (
    <li className={`w-full relative mb-8`}>
        <div className="block bg-black/20 text-white rounded-bl-xl rounded-tr-xl truncate">
           <PostBody
                id = {props.id}
                username = {props.authorUsername}
                displayName = {props.authorDisplayName}
                userColor = {props.userColor}
                postDate = {props.postDate}
                pictureURL = {props.authorPictureURL}
                isEdited = {props.isEdited}
                pinned = {props.pinned ?? false}
                text = {props.text}
                imageURL = {props.imageURL}
                editor = {editor}
                rechirper = {props.rechirper}
                allowClick = {true}
            />
        </div>


        {dots}
        <Vote postId={props.id} initialScore={props.score} initialVoteStatus = {props.voteStatus}/>
    </li>
    )


}


export default Chirp