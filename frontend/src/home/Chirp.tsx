import { PostChirp } from "../App"
import Vote from "../boards/Vote"


interface ChirpProps extends PostChirp {
    pinned?: boolean
}

function Chirp(props: ChirpProps) {
    return (<li className={`w-full relative mt-8`}>
        <a href={`/profile/${props.authorUsername}`} className="absolute -top-4 -left-4 z-10 bg-stone-300 text-black p-1 rounded-lg border border-black/20">
            <div className = "inline">{props.authorDisplayName}</div>
            <div className="text-xs m-0 inline h-fit"> {`• @${props.authorUsername} •`} </div>
            <div className="text-xs inline"> {props.postDate} </div>
        </a>

        { props.pinned ?
        <div className="absolute -top-4 right-10 z-10 bg-gray-300 text-black text-sm rounded-xl p-2 border border-black/20">
            Pinned Post
        </div>
        : null}

        <a href={`/board/${props.id}`}>
            <div className={`w-full relative p-10 pb-8 border border-black rounded-xl break-all text-white ${props.pinned ? "bg-rose-400/25" : "bg-black/10" }`}>
                {props.text}
            </div>
        </a>

        <Vote postId={props.id} initialScore={props.score} initialVoteStatus = {props.voteStatus}/>
    </li>
    )


}


export default Chirp