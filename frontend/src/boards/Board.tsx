import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { PostInfo, PostPayload, UserContext } from "../App"
import useOptions from "../hooks/useOptions"
import useScrollBottom from "../hooks/useScrollBottom"
import useSort from "../hooks/useSort"
import Layout from "../Layout"
import PostBody from "../PostBody"
import SpinningCircle from "../SpinningCircle"
import Comment from "./Comment"
import BoardPlaceholder from "../placeholders/BoardPlaceholder"
import CommentsPlaceholder from "../placeholders/CommentsPlaceholder"
import ReplyBox from "./ReplyBox"
import Vote from "./Vote"

export interface BoardInfo extends PostInfo {
    commentCount: number
    parentPost?: string | null
    rootPost?: string | null
    userColor: string
}


function Board() {
    const [mainPost, setMainPost] = useState<BoardInfo | null>(null)
    const [parentPost, setParentPost] = useState<BoardInfo | null>(null)
    const [comments, setComments] = useState<JSX.Element[]>([])
    const [doneFetching, setDoneFetching] = useState(false);
    //local comments are sent to the server, but also store them here to avoid a 2nd fetch
    const [localComments, setLocalComments] = useState<JSX.Element[]>([])

    const [pageNum, setPageNum] = useState(0); //start at 1 because the first page is already loaded
    const [hasNextPage, setHasNextPage] = useState(true);
    
    const params = useParams();
    const navigate = useNavigate();
    
    const userInfo = useContext(UserContext);
    

    useEffect( () => {
        //on load, get the params
        if (params && params.id) {
            fetchPost(params.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] )

    
    const fetchPost = async (postId: string) => {
        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()

        const query =
        `query {    
            post(id: "${postId}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                author {
                    username
                    displayName
                    userColor
                    pictureURL
                }
                text
                imageURL
                parentPost {
                    id
                    text
                    commentCount
                    postDate(timezone: ${timezone})
                    score
                    isEdited
                    ${userInfo.state.username ? "voteStatus" : ""}
                    ${userInfo.state.username ? "rechirpStatus" : ""}
                    author {
                        username
                        displayName
                        userColor
                        pictureURL
                    }
                }
                rootPost {
                    id
                }
                isComment
                isEdited
                postDate(timezone: ${timezone})
                score
                commentCount
                ${userInfo.state.username ? "voteStatus" : ""}
                ${userInfo.state.username ? "rechirpStatus" : ""}
                comments(pageNum:${pageNum}, size:10, sortMethod: "${sortMethod}", sortDirection: "${sortDirection}") {
                    posts {
                        id
                        text
                        commentCount
                        postDate(timezone: ${timezone})
                        score
                        isEdited
                        ${userInfo.state.username ? "voteStatus" : ""}
                        ${userInfo.state.username ? "rechirpStatus" : ""}
                        author {
                            username
                            displayName
                            userColor
                            pictureURL
                        }
                    }
                    hasNext
                }
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())

        console.log(response)  
        setDoneFetching(true);

        if (response.errors || !response.data.post) {
            return;
        }
        

        const info: PostPayload = response.data.post;
        setMainPost({
            id: postId,
            text: info.text,
            imageURL: info.imageURL,
            voteStatus: userInfo.state.username ? info.voteStatus : 0,
            rechirpStatus: userInfo.state.username ? info.rechirpStatus : false,
            postDate: info.postDate,
            authorUsername: info.author.username,
            authorDisplayName: info.author.displayName,
            authorPictureURL: info.author.pictureURL,
            commentCount: info.commentCount,
            score: info.score,
            parentPost: info.parentPost ? info.parentPost.id : null,
            rootPost: info.rootPost ? info.rootPost.id : null,
            userColor: info.author.userColor,
            isEdited: info.isEdited,
        })
        setPageNum(pageNum + 1)
        setHasNextPage(info.comments.hasNext)

        setComments(comments.concat(
            info.comments.posts.map((comment: PostPayload) => {
                return <Comment
                    key = {comment.id}
                    id = {comment.id}
                    text = {comment.text}
                    postDate = {comment.postDate}
                    imageURL = {""}
                    authorUsername = {comment.author.username}
                    authorDisplayName = {comment.author.displayName}
                    authorPictureURL = {comment.author.pictureURL}
                    commentCount = {comment.commentCount}
                    score = {comment.score}
                    isEdited = {comment.isEdited}
                    voteStatus = {userInfo.state.username ? comment.voteStatus : 0}
                    local = {false}
                    autoLoadComments = {info.commentCount < 10}
                    userColor = {comment.author.userColor}
                    sortMethod = {sortMethod}
                    sortDirection = {sortDirection}
                    rechirpStatus = {userInfo.state.username ? comment.rechirpStatus : false}
                />
            })
        ))

        const parentInfo = info.parentPost;

        if (parentInfo) {
            setParentPost({
                id: parentInfo.id,
                text: parentInfo.text,
                imageURL: parentInfo.imageURL,
                voteStatus: userInfo.state.username ? parentInfo.voteStatus : 0,
                rechirpStatus: userInfo.state.username ? parentInfo.rechirpStatus : false,
                postDate: parentInfo.postDate,
                authorUsername: parentInfo.author.username,
                authorDisplayName: parentInfo.author.displayName,
                authorPictureURL: parentInfo.author.pictureURL,
                commentCount: parentInfo.commentCount,
                score: parentInfo.score,
                parentPost: parentInfo.parentPost ? parentInfo.parentPost.id : null,
                rootPost: parentInfo.rootPost ? parentInfo.rootPost.id : null,
                userColor: parentInfo.author.userColor,
                isEdited: parentInfo.isEdited,
            })
        }

    }

    const getComments = async () => {
        if (!mainPost || !hasNextPage) {
            return; 
        }
        setDoneFetching(false)

        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL
        const query =
        `query {    
            post(id: "${mainPost.id}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                comments(pageNum:${pageNum}, size:10, sortMethod: "${sortMethod}", sortDirection: "${sortDirection}") {
                    posts {
                        id
                        text
                        commentCount
                        postDate(timezone: ${timezone})
                        score
                        isEdited
                        ${userInfo.state.username ? "voteStatus" : ""}
                        ${userInfo.state.username ? "rechirpStatus" : ""}
                        author {
                            username
                            displayName
                            userColor
                            pictureURL
                        }
                    }
                    hasNext
                }
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        
        console.log(response)
        
        if (response.errors)
            navigate("/");
        
        const info: PostPayload = response.data.post;
        if (!info || info.isComment) {
            navigate("/");
        }

        setPageNum(pageNum + 1)
        setHasNextPage(info.comments.hasNext)

        setComments(comments.concat(
            info.comments.posts.map((comment: PostPayload) => {
                return <Comment
                    key = {comment.id}
                    id = {comment.id}
                    text = {comment.text}
                    postDate = {comment.postDate}
                    imageURL = {""}
                    authorUsername = {comment.author.username}
                    authorDisplayName = {comment.author.displayName}
                    authorPictureURL = {comment.author.pictureURL}
                    commentCount = {comment.commentCount}
                    score = {comment.score}
                    isEdited = {comment.isEdited}
                    voteStatus = {userInfo.state.username ? comment.voteStatus : 0}
                    local = {false}
                    autoLoadComments = {mainPost.commentCount < 10}
                    userColor = {comment.author.userColor}
                    sortMethod = {sortMethod}
                    sortDirection = {sortDirection}
                    rechirpStatus = {userInfo.state.username ? comment.rechirpStatus : false}
                />
            })
        ))

        setDoneFetching(true);
    }


    const [sortMethod, sortDirection, sortBubble] = useSort(mainPost !== null, getComments, () => {
        setComments([])
        setLocalComments([])
        setPageNum(0)
        setHasNextPage(true);
    })

    useScrollBottom(async () => {
        await getComments()
    })

    const [dots, editor] = useOptions(
            mainPost ? mainPost.id : "",
            mainPost ? mainPost.text : "", 
            mainPost ? userInfo.state.username === mainPost.authorUsername : false,
            null,
            false,
            mainPost ? mainPost.rechirpStatus : false)
            
        
    if (!mainPost) {
        return <Layout>
            {doneFetching ? 
                <div className="text-center bg-red-200 py-8 shadow-md">
                    <h1>Board deleted or not found</h1>
                </div>
            :
            <BoardPlaceholder />}
        </Layout>
    }
    
    return (
        <Layout>
            {sortBubble}
            {mainPost.rootPost && mainPost.parentPost !== mainPost.rootPost ?
            <div className = "bg-black/20 w-fit m-4 px-4 py-2 rounded-xl text-white">
                <a href={`/board/${mainPost.rootPost}`}>← Top of the board</a>
            </div>    
            : null}

            {parentPost ? 
            <div className = "w-11/12 md:w-[90%] mx-auto mt-6 mb-6 rounded-bl-xl rounded-tr-xl bg-black/40 text-white relative break-all shadow-md">
                <PostBody
                    id = {parentPost.id}
                    username = {parentPost.authorUsername}
                    displayName = {parentPost.authorDisplayName}
                    userColor = {parentPost.userColor}
                    postDate = {parentPost.postDate}
                    pictureURL = {mainPost.authorPictureURL}
                    isEdited = {parentPost.isEdited}
                    text = {parentPost.text}
                    imageURL = {parentPost.imageURL}
                    editor = {null}
                    allowClick = {true}
                />

                <Vote postId = {parentPost.id} initialScore = {parentPost.score} initialVoteStatus = {parentPost.voteStatus}/>
            </div>
            : null}

            <div className = "mx-auto w-11/12 md:w-4/5">
            
                <div>
                    <div className = "w-full mt-6 mb-6 rounded-bl-xl rounded-tr-xl bg-black/20 text-white relative break-all shadow-md">
                        <PostBody
                            id = {mainPost.id}
                            username = {mainPost.authorUsername}
                            displayName = {mainPost.authorDisplayName}
                            userColor = {mainPost.userColor}
                            postDate = {mainPost.postDate}
                            pictureURL = {mainPost.authorPictureURL}
                            isEdited = {mainPost.isEdited}
                            text = {mainPost.text}
                            imageURL = {mainPost.imageURL}
                            editor = {editor}
                        />

                        {dots}

                        <Vote postId = {mainPost.id} initialScore = {mainPost.score} initialVoteStatus = {mainPost.voteStatus}/>

                    </div>
                </div>
                
                <div className = "bg-black/20 p-4 my-2 rounded-xl shadow-md">
                    {userInfo.state.username ?
                        <ReplyBox 
                            postId = {mainPost.id} 
                            sortMethod = {sortMethod}
                            sortDirection = {sortDirection}
                            addReply = {(reply) => {
                                setLocalComments([reply, ...localComments])
                            }}/> 
                    : null}

                    {!doneFetching ? <SpinningCircle /> : null}

                    {
                    localComments.length === 0 && comments.length === 0 ?
                    <>
                        <CommentsPlaceholder opacity = {"90%"} showNoComments = {doneFetching}/>
                        <CommentsPlaceholder opacity = {"80%"} />
                        <CommentsPlaceholder opacity = {"70%"} />
                        <CommentsPlaceholder opacity = {"60%"} />
                        <CommentsPlaceholder opacity = {"50%"} />
                    </>
                    :
                        <div className = "w-full mb-10 border-l ml-[1px] border-l-gray-500">
                            {
                            localComments.length > 0 ? localComments.concat(comments) 
                            :
                            comments}
                        </div>
                    }
                </div>
            </div>
        </Layout>
    )


}


export default Board