/* eslint-disable camelcase */

let db;

async function updateVVS(video_time, engage_time, updated_at, view_id) {
    const sql = 'UPDATE video_view_stats_temp_v1 SET ? WHERE view_id = ?';
    return db.mysql.write.query(sql, [{ video_time, engage_time, updated_at }, view_id]);
}

async function getVideoViewStatByReferId(view_id) {
    const sql = 'SELECT view_id from video_view_stats_temp_v1 WHERE is_back = 1 AND refer_id = ? order by view_id desc limit 1';
    return db.mysql.read.query(sql, [view_id.toString()]);
}

async function getVideoViewStatById(view_id) {
    const sql = 'SELECT * from video_view_stats_temp_v1 WHERE view_id = ?';
    return db.mysql.read.query(sql, [view_id]);
}

async function insertVVS(data) {
    const sql = 'INSERT INTO video_view_stats_temp_v1 SET ?';
    return db.mysql.write.query(sql, [data]);
}

async function updateAnswerView(data, app) {
    let { videoTime, engageTime } = data;
    const { ts, viewId, isback: isBack } = data;
    db = app.get('db');
    let vvsRow = await getVideoViewStatById(viewId);
    if (vvsRow.length == 0) {
        throw new Error(`No VVS row ${viewId}`);
    }
    vvsRow = vvsRow[0];
    if (vvsRow.engage_time >= engageTime) {
        engageTime = vvsRow.engage_time;
    }
    if (vvsRow.video_time >= videoTime) {
        videoTime = vvsRow.video_time;
    }
    if (isBack === '1') {
        // check if view exist with is_back
        const isBackRow = await getVideoViewStatByReferId(viewId);
        if (isBackRow.length > 0) {
            await updateVVS(videoTime, engageTime, ts, isBackRow[0].view_id);
        } else {
            const viewData = {
                student_id: vvsRow.student_id,
                question_id: vvsRow.question_id,
                answer_id: vvsRow.answer_id,
                answer_video: vvsRow.answer_video,
                engage_time: engageTime,
                video_time: videoTime,
                parent_id: vvsRow.parent_id,
                is_back: 1,
                session_id: vvsRow.session_id,
                tab_id: vvsRow.tab_id,
                ip_address: vvsRow.ip_address,
                source: vvsRow.source,
                refer_id: viewId,
                created_at: ts,
                updated_at: ts,
            };
            await insertVVS(viewData);
        }
    }
    if (engageTime > vvsRow.engage_time || videoTime > vvsRow.video_time) {
        await updateVVS(videoTime, engageTime, ts, viewId);
    }
    console.log('done');
}

module.exports = {
    updateAnswerView,
};
