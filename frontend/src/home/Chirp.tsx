import { PostChirp } from "../App"
import Vote from "../boards/Vote"
import useOptions from "../hooks/useOptions"


interface ChirpProps extends PostChirp {
    pinned?: boolean
    userColor: string
}

function Chirp(props: ChirpProps) {
    const [dots, editor] = useOptions(true, props.id, props.text)
    
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
                <div className = "text-xs inline italic">
                    {` • edited `}
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