 const canvas = document.getElementById('myChart');
        const ctx = canvas.getContext('2d');

        const data = [12, 19, 3, 5, 2, 3]; // Sample data
        const labels = ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'];
        const barWidth = 50;
        const maxBarHeight = 200;

        // Function to create a gradient
        function createGradient(x, y, width, height) {
            const gradient = ctx.createLinearGradient(x, y, x, y + height);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
            return gradient;
        }

        // Draw the bars with gradient and shadow
        data.forEach((value, index) => {
            const barHeight = (value / Math.max(...data)) * maxBarHeight;
            const barX = index * (barWidth + 20) + 30; // Added margin

            // Draw shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // Draw gradient bar
            ctx.fillStyle = createGradient(barX, canvas.height - barHeight, barWidth, barHeight);
            ctx.fillRect(barX, canvas.height - barHeight, barWidth, barHeight);

            // Reset shadow
            ctx.shadowColor = 'transparent';
        });

        // Draw labels
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        labels.forEach((label, index) => {
            const barX = index * (barWidth + 20) + 30; // Added margin
            ctx.fillText(label, barX, canvas.height - 5);
        });