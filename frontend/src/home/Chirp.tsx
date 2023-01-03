import { useContext } from "react"
import { PostChirp, UserContext } from "../App"
import Vote from "../boards/Vote"
import useOptions from "../hooks/useOptions"


interface ChirpProps extends PostChirp {
    pinned: boolean | null
    isRechirp: boolean
    userColor: string
}

function Chirp(props: ChirpProps) {
    const userInfo = useContext(UserContext);
    const [dots, editor] = useOptions(props.id, props.text, userInfo.state.username === props.authorUsername, props.pinned, props.isRechirp)

    return (
    <li className={`w-full relative mb-8`}>
        <div className="block bg-black/10 text-white p-1 pr-6 border rounded-bl-xl rounded-tr-xl truncate border-black">
            <a href={`/profile/${props.authorUsername}`} className="text-xs ml-2 inline" style = {{color: props.userColor}}>
                {props.authorDisplayName}
            </a>
            <a href={`/profile/${props.authorUsername}`} className="text-xs m-0 inline h-fit"> 
                {` • @${props.authorUsername}`} 
            </a>
            <div className="text-xs inline"> 
                {` • ${props.postDate}`} 
            </div>


            {props.isEdited ? 
                <div className = "text-xs inline italics">
                    <span className = "text-white">
                        {` • `}
                    </span>
                    <span className = "text-yellow-300">
                        {`edited`}
                    </span>
                </div>
            : null}

            {props.pinned ? 
                <div className = "text-xs inline font-bold">
                    <span className = "text-white">
                        {` • `}
                    </span>
                    <span className = "text-rose-300">
                        {`pinned`}
                    </span>
                </div>
            : null}

            {props.isRechirp ? 
                <div className = "text-xs inline font-bold">
                    <span className = "text-white">
                        {` • `}
                    </span>
                    <span className = "text-sky-300">
                        {`rechirp`}
                    </span>
                </div>
            : null}


            {editor ? editor :
            <a href={`/board/${props.id}`}>
                <div className={`w-full max-h-96 overflow-y-hidden whitespace-pre p-6 pt-3 break-all text-white`}>
                    {props.text}
                </div>
            </a> }
        </div>


        {dots}
        <Vote postId={props.id} initialScore={props.score} initialVoteStatus = {props.voteStatus}/>
    </li>
    )


}


export default Chirp