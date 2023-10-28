const dailyExpiry = 60 * 60 * 24;

module.exports = class PopularStudents {
    static getPopularStudents(client, studentId) {
        return client.hgetAsync(`popular_students_${studentId}`, 'POPULAR_STUDENTS');
    }

    static setPopularStudents(client, studentId, data) {
        return client.multi()
            .hset(`popular_students_${studentId}`, 'POPULAR_STUDENTS', JSON.stringify(data))
            .expire(`popular_students_${studentId}`, dailyExpiry)
            .execAsync();
    }
};
