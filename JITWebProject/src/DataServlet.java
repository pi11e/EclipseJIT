

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.sun.jmx.snmp.Timestamp;

import de.tudresden.mg.ebookshelf.data.BaseXController;

/**
 * Servlet implementation class DataServlet
 */
@WebServlet("/DataServlet")
public class DataServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

	private BaseXController dbController;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public DataServlet() {
        super();
        this.dbController = new BaseXController();
        
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

		ServletOutputStream out = response.getOutputStream();

		initializeDB();
		
		// execute query, expect it in request parameter "query"
		String query = request.getParameter("query");
		
		// allow only XQUERY:
		if(query != null && query.startsWith("XQUERY"))
		{
			System.out.println(new Timestamp().getDate() +" DataServlet | executing " + query);
			this.dbController.executeQuery(query, out);	
		}
		else
		{
			System.out.println("Invalid query " + query);
			System.out.println("Only XQUERY allowed (query has to start with the XQUERY keyword).");
			
		}
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
	}
	
	
	private void initializeDB()
	{
		// important flag: use sample data (MUCH smaller dataset) or not
		boolean useSampleData = false;
		
		String pathToXMLData = useSampleData ? this.getServletContext().getRealPath("data/sampleData.xml") : this.getServletContext().getRealPath("data/data.xml");
		
		// creates a server instance IF it is not already running
		if(this.dbController.createServer(pathToXMLData))
		{
			System.out.println("Creating database ...");
			System.out.println("Database with data from " + pathToXMLData);
			System.out.println("is up and running.");
		}
	}

}
