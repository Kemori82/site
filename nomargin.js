// Add this useEffect to remove body margin
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.overflowX = 'hidden'; // Prevent horizontal scrolling
    return () => {
      document.body.style.margin = '';
      document.body.style.overflowX = ''; // Clean up
    };
  }, []);