class TestSimulation {
    static timeout({ query: { time } }, res) {
        console.log(`Timeout for ${time}`);

        setTimeout(() => {
            res.status(504).json({ message: 'timeout finished' });
        }, time);
    }
}

module.exports = TestSimulation;
